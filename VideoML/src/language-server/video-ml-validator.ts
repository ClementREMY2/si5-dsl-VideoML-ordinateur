import { AstNode, Reference, ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMLAstType,
    isFixedTimelineElement,
    TimelineElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isVideoElement,
    VideoOriginal,
    VideoExtract,
    isVideoExtract,
    isVideoOriginal,
    AudioOriginal,
    AudioExtract,
    isAudioOriginal,
    isAudioExtract,
    Element,
    isTextFontColor,
    isTextualElement,
    isVisualElementPosition,
    isTextFont,
    isTextAligment,
    isTextFontSize,
    TextFont,
    TextualElement,
    VideoBrightness,
    VideoContrast,
    VideoOpacity,
    VideoResolution,
    VideoScale,
    VideoElement,
    isVideoBrightness,
    isVideoContrast,
    isVideoOpacity,
    isVideoResolution,
    isVideoScale,
    VideoSaturation,
    VideoPainting,
    AudioVolume,
    AudioStereoVolume,
    AudioFadeIn,
    AudioFadeOut,
    AudioElement,
    isAudioVolume,
    isAudioStereoVolume,
    isAudioFadeIn,
    isAudioFadeOut,
    isAudioElement,
    VideoTransition,
    GroupOption,
    isGroupOptionVideo,
    isGroupOptionAudio,
    isGroupOptionText,
    TextOption,
    VideoOption,
    AudioOption,
} from './generated/ast.js';
import type { VideoMlServices } from './video-ml-module.js';
import { validateFilePath } from './validators/special-validators.js';
import { helperTimeToSeconds } from '../lib/helper.js';

const IS_ELECTRON = process.env.IS_ELECTRON === 'true';

// Used to call renderer process from worker in Electron in a synchronous way
const asyncRequestMap = new Map();
if (IS_ELECTRON) {
    self.addEventListener('message', (event) => {
        const { result } = event.data;
        if (result?.content && result?.indexName && asyncRequestMap.has(result.indexName)) {
            asyncRequestMap.get(result.indexName)(result.content);
            asyncRequestMap.delete(result.indexName);
        }
    });
} 

let lastId = 10000000;
// Function to simulate synchronous calls from worker to renderer process in Electron
async function invokeSpecialCommand(
    command: string,
    commandParams: object,
    indexName: string,
    executionParams: {
        needNodeJs: boolean;
    },
): Promise<any> {
    return new Promise((resolve) => {
        const id = Date.now() + lastId++;
        asyncRequestMap.set(indexName, resolve);

        self.postMessage({
            jsonrpc: "2.0",
            id,
            method: `custom/${command}`,
            params: {
                commandParams,
                indexName,
                executionParams,
            },
        });
    });
}

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: VideoMlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.VideoMlValidator;
    const checks: ValidationChecks<VideoMLAstType> = {
        VideoProject: validator.checkVideoProject,
        AudioOriginal: validator.checkAudioOriginal,
        AudioExtract: validator.checkAudioExtract,
        VideoOriginal: validator.checkVideoOriginal,
        VideoExtract: validator.checkVideoExtract,
        TimelineElement: validator.checkTimelineElement,
        RelativeTimelineElement: validator.checkRelativeTimelineElement,
        Element: validator.checkElement,
        VideoTransition: validator.checkVideoTransition,
        GroupOption: validator.checkGroupOption,
        };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class VideoMlValidator {
    checkVideoProject(videoProject: VideoProject, accept: ValidationAcceptor): void {
        this.checkOutputFileName(videoProject, accept);
        this.checkTimelineElementAtStart(videoProject, accept);
        this.checkRelativeTimelineElementsInfiniteRecursion(videoProject, accept);
        this.checkLayerTimelineElementsInfiniteRecursion(videoProject, accept);
        this.checkNameForTimelineElements(videoProject, accept);
        this.checkNameForElements(videoProject, accept);
    }

    checkNameForElements(videoProject: VideoProject, accept: ValidationAcceptor): void {
        const elements = videoProject.elements;

        // Check name duplicate
        const names = new Set<string>();
        elements.forEach((element) => {
            if (!!element) {
                if (names.has(element.name)) {
                    accept('error', 'Element names must be unique', { node: element, property: 'name' });
                }
                names.add(element.name);
            } 
        });
    } 

    checkGroupOption(groupOption: GroupOption, accept: ValidationAcceptor): void {
        if (groupOption.elements) {
            const names = new Set<string>();
            groupOption.elements.forEach((element: Reference<VideoElement|TextualElement|AudioElement>) => {
                if (element.ref) {
                    if (names.has(element.ref?.name)) {
                        accept('error', 'Element names must be unique', { node: groupOption });
                    }
                    names.add(element.ref.name);
                }
            });
        }
        if(groupOption.options) {
            groupOption.options.forEach((option: any) => {
                if(isGroupOptionVideo(groupOption)) {
                    this.checkVideoOption(option, accept);
                } else if (isGroupOptionAudio(groupOption)) {
                    this.checkAudioOption(option, accept);
                } else if (isGroupOptionText(groupOption)) {
                    this.checkTextOption(option, accept);
                }
            });
        
        }
    }

    checkRelativeTimelineElement(element: RelativeTimelineElement, accept: ValidationAcceptor): void {
        this.checkTimelineElementRelativePlacementOrder(element, accept);
    }

    async checkAudioOriginal(audioOriginal: AudioOriginal, accept: ValidationAcceptor): Promise<void> {
        await this.checkAudioOriginalPath(audioOriginal, accept);
    }

    async checkAudioExtract(audioExtract: AudioExtract, accept: ValidationAcceptor): Promise<void> {
        await this.checkAudioExtractValidTimeCodes(audioExtract, accept);
    }

    async checkVideoOriginal(videoOriginal: VideoOriginal, accept: ValidationAcceptor): Promise<void> {
        await this.checkVideoOriginalPath(videoOriginal, accept);
    }

    async checkVideoExtract(videoExtract: VideoExtract, accept: ValidationAcceptor): Promise<void> {
        await this.checkVideoExtractValidTimeCodes(videoExtract, accept);
    }

    async checkVideoExtractValidTimeCodes(videoExtract: VideoExtract, accept: ValidationAcceptor): Promise<void> {
        if (!videoExtract.start || !videoExtract.end) {
            accept('error', 'Start and end time must be defined', { node: videoExtract });
            return;
        }

        // Check if Start time is less than End time
        if (helperTimeToSeconds(videoExtract.start) >= helperTimeToSeconds(videoExtract.end)) {
            accept('error', 'Start time must be before end time', { node: videoExtract, property: 'start' });
        }

        // Check if End time is less or equal to the video duration
        const source = videoExtract.source?.ref;
        if (!source) {
            accept('error', 'Source video not found', { node: videoExtract, property: 'source' });
            return;
        }

        let duration;
        if (isVideoExtract(source)) {
            duration = helperTimeToSeconds(source.end) - helperTimeToSeconds(source.start);
        } else if (isVideoOriginal(source)) {
            const indexName = `get-video-original-duration-${videoExtract.$containerProperty}-${videoExtract.$containerIndex}`;
            duration = await invokeSpecialCommand(
                'get-video-original-duration',
                { path: source.filePath },
                indexName,
                { needNodeJs: false },
            );
        }
        if (!duration || duration === -1) {
            accept('error', 'Failed to get source video duration', { node: videoExtract, property: 'source' });
            return;
        }

        if (helperTimeToSeconds(videoExtract.end) > duration) {
            accept('error', 'End time is greater than source video duration', { node: videoExtract, property: 'end' });
        }
    }


    checkTimelineElement(element: TimelineElement, accept: ValidationAcceptor): void {
        this.checkTimelineElementDurationOnlyForText(element, accept);
    }

    // Check timeline elemnts names (unique and ordered, first must be 1)
    checkNameForTimelineElements(videoProject: VideoProject, accept: ValidationAcceptor): void {
        // Check if first is 1
        const firstElement = videoProject.timelineElements[0];
        if (firstElement && firstElement.name !== '#1') {
            accept('error', 'First timeline element must have identifier #1', { node: firstElement, property: 'name' });
            return;
        }

        // Check if ordered and unique
        const ids = new Set<string>();
        let lastId = 0;   
        for (const element of videoProject.timelineElements) {
            if (ids.has(element.name)) {
                accept('error', 'Timeline elements must have unique identifiers', { node: element, property: 'name' });
            }
            ids.add(element.name);
            if (parseInt(element.name.slice(1)) <= lastId) {
                accept('error', `Timeline elements must have ordered identifiers (this one should be at least #${lastId + 1})`, { node: element, property: 'name' });
            }
            lastId = parseInt(element.name.slice(1));
        }
    }

    checkRelativeTimelineElementsInfiniteRecursion(videoProject: VideoProject, accept: ValidationAcceptor): void {
        // For each timeline elements, check if we have infinite recursion
        let currentAnalyzingElement: RelativeTimelineElement | null = null;
        let recursivePath: string[] = [];
        const isInfiniteRecursion = (element: RelativeTimelineElement): boolean => {
            // If there is no relative element yet, return false
            if (!element.relativeTo) {
                return false;
            }

            if (element.relativeTo.ref === currentAnalyzingElement) {
                recursivePath.push(element.relativeTo.ref.name);
                return true;
            }

            if (isRelativeTimelineElement(element.relativeTo.ref)) {
                recursivePath.push(element.relativeTo.ref.name);
                return isInfiniteRecursion(element.relativeTo.ref);
            }
            return false;
        }

        for (let i = 0; i < videoProject.timelineElements.length; i++) {
            const element = videoProject.timelineElements[i];
            if (isRelativeTimelineElement(element) && element.relativeTo) {
                currentAnalyzingElement = element;
                recursivePath = [];
                if (isInfiniteRecursion(element)) {
                    accept('error', `Infinite recursion detected. Path: ${element.name} -> ${recursivePath.join(' -> ')}`, { node: element, property: 'relativeTo' });
                    // Only show one error per project to avoid max call stack error
                    break;
                }
            }
        };
    }

    // Check if video output name is a valid file name
    checkOutputFileName(videoProject: VideoProject, accept: ValidationAcceptor): void {
        if (videoProject.outputName) {
            const regex = new RegExp(/^[a-zA-Z0-9\-_.]+$/);
            if (!regex.test(videoProject.outputName)) {
                accept('error', 'Invalid output file name', { node: videoProject, property: 'outputName' });
            }
        }
    }

    async checkVideoOriginalPath(videoOriginal: VideoOriginal, accept: ValidationAcceptor): Promise<void> {
        if (!videoOriginal.filePath) return;

        let errors = [];
        if (!IS_ELECTRON) {
            errors = await validateFilePath(videoOriginal.filePath);
        } else {
            // Filepath verification will be handled by Electron (main process)
            const indexName = `validate-file-${videoOriginal.filePath}-${videoOriginal.$containerProperty}-${videoOriginal.$containerIndex}`;
            errors = await invokeSpecialCommand(
                'validate-file',
                { path: videoOriginal.filePath },
                indexName,
                { needNodeJs: true },
            );
        }

        (errors || []).forEach((error: { type: 'error' | 'warning' | 'info' | 'hint', message: string }) => {
            accept(error.type, error.message, { node: videoOriginal, property: 'filePath' });
        });
    }

    async checkAudioOriginalPath(audioOriginal: AudioOriginal, accept: ValidationAcceptor): Promise<void> {
        if (!audioOriginal.filePath) return;

        let errors = [];
        if (!IS_ELECTRON) {
            errors = await validateFilePath(audioOriginal.filePath);
        } else {
            // Filepath verification will be handled by Electron (main process)
            const indexName = `validate-file-${audioOriginal.filePath}-${audioOriginal.$containerProperty}-${audioOriginal.$containerIndex}`;
            errors = await invokeSpecialCommand(
                'validate-file',
                { path: audioOriginal.filePath },
                indexName,
                { needNodeJs: true },
            );
        }

        (errors || []).forEach((error: { type: 'error' | 'warning' | 'info' | 'hint', message: string }) => {
            accept(error.type, error.message, { node: audioOriginal, property: 'filePath' });
        });
    }

    async checkAudioExtractValidTimeCodes(audioExtract: AudioExtract, accept: ValidationAcceptor): Promise<void> {
        if (!audioExtract.start || !audioExtract.end) {
            accept('error', 'Start and end time must be defined', { node: audioExtract });
            return;
        }

        // Check if Start time is less than End time
        if (helperTimeToSeconds(audioExtract.start) >= helperTimeToSeconds(audioExtract.end)) {
            accept('error', 'Start time must be before end time', { node: audioExtract, property: 'start' });
        }

        // Check if End time is less or equal to the video duration
        const source = audioExtract.source?.ref;
        if (!source) {
            accept('error', 'Source audio not found', { node: audioExtract, property: 'source' });
            return;
        }

        let duration;
        if (isAudioExtract(source)) {
            duration = helperTimeToSeconds(source.end) - helperTimeToSeconds(source.start);
        } else if (isAudioOriginal(source)) {
            const indexName = `get-audio-original-duration-${audioExtract.$containerProperty}-'${audioExtract.$containerIndex}'`;
            duration = await invokeSpecialCommand(
                'get-audio-original-duration',
                { path: source.filePath },
                indexName,
                { needNodeJs: false },
            );
        }
        if (!duration || duration === -1) {
            accept('error', 'Failed to get source audio duration', { node: audioExtract, property: 'source' });
            return;
        }

        if (helperTimeToSeconds(audioExtract.end) > duration) {
            accept('error', 'End time is greater than source audio duration', { node: audioExtract, property: 'end' });
        }
    }

    // Check paramaters of the first element in the timeline
    checkTimelineElementAtStart(videoProject: VideoProject, accept: ValidationAcceptor): void {
        if (videoProject.timelineElements.length > 0) {
            const firstElement = videoProject.timelineElements[0];
            if (isRelativeTimelineElement(firstElement) || isFixedTimelineElement(firstElement)) {
                accept('error', 'First element in timeline must not have time parameters, it will be the starting point of the video (00:00)', { node: firstElement });
            }
        }
    }

    checkLayerTimelineElementsInfiniteRecursion(videoProject: VideoProject, accept: ValidationAcceptor): void {
        // For each timeline elements, check if we have infinite recursion
        let currentAnalyzingElement: TimelineElement | null = null;
        let recursivePath: string[] = [];
        const isLayerInfiniteRecursion = (element: TimelineElement): boolean => {
            // If there is no relative element yet, return false
            if (!element.layerPosition || !element.layerPosition.relativeTo) {
                return false;
            }

            if (element.layerPosition.relativeTo.ref === currentAnalyzingElement) {
                recursivePath.push(element.layerPosition.relativeTo.ref.name);
                return true;
            }

            if (isRelativeTimelineElement(element.layerPosition.relativeTo.ref)) {
                recursivePath.push(element.layerPosition.relativeTo.ref.name);
                return isLayerInfiniteRecursion(element.layerPosition.relativeTo.ref);
            }
            return false;
        }

        for (let i = 0; i < videoProject.timelineElements.length; i++) {
            const element = videoProject.timelineElements[i];
            if (element.layerPosition) {
                currentAnalyzingElement = element;
                recursivePath = [];
                if (isLayerInfiniteRecursion(element)) {
                    accept('error', `Infinite recursion detected. Path: ${element.name} -> ${recursivePath.join(' -> ')}`, { node: element, property: 'layerPosition' });
                    // Only show one error per project to avoid max call stack error
                    break;
                }
            }
        };
    }

    checkElement(element: Element, accept: ValidationAcceptor): void {
        if(isTextualElement(element)) {
            this.checkTextualElement(element, accept);
        }
        else if (isVideoElement(element)) {
            this.checkVideoElement(element, accept);
        }
        else if (isAudioElement(element)) {
            this.checkAudioElement(element, accept);
        }
    }

    checkTextualElement(element: TextualElement, accept: ValidationAcceptor): void {
        if (element.type === 'subtitle') {
            this.checkSubtitleLength(element, accept);
        }
        if (!element.options) return;
        element.options.forEach((option) => {
            this.checkTextOption(option, accept, element);
        });
    }

    checkTextOption(option: TextOption, accept: ValidationAcceptor, element?: TextualElement): void {
        if (isTextFontColor(option)) {
            this.checkColor(option.color, option, 'color', accept);
        } else if(isVisualElementPosition(option) && (element?.type === 'subtitle' || false)) {
            accept('error', 'Position is not allowed in subtitle elements', { node: option });
        } else if (isTextFont(option)) {
            this.checkFontSetting(option, accept);
        } else if (isTextAligment(option)) {
            const validAlignments = ['left', 'center', 'right'];
            if (!validAlignments.includes(option.alignment)) {
                accept('error', 'Alignment must be "left", "center" or "right"', { node: option, property: 'alignment' });
            }
        } else if (isTextFont(option)) {
            this.checkFontSetting(option, accept);
        } else if (isTextFontSize(option)) {
            if (option.size < 0 || option.size > 128) {
                accept('error', 'Font size must be between 0 and 128', { node: option, property: 'size' });
            }
        }
    }

    checkFontSetting(fontSetting: TextFont, accept: ValidationAcceptor): void {
        const validFonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Palatino Linotype', 'Book Antiqua', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
        if (!validFonts.includes(fontSetting.name)) {
            accept('error', 'Font must be a valid font name', { node: fontSetting, property: 'name' });
        }
    }

    checkColor(color: string, node: AstNode, property: string, accept: ValidationAcceptor): void {
        const validColors = ['red', 'green', 'blue', 'yellow', 'black', 'white', 'gray', 'purple', 'orange', 'pink', 'brown'];
        if (!validColors.includes(color.toLowerCase())) {
            accept('error', 'Color must be a valid color name', { node, property });
        }
    }

    checkSubtitleLength(subtitle: TextualElement, accept: ValidationAcceptor): void {
        if (subtitle.text.length > 100) {
            accept('warning', 'Subtitle length is long, it is recommended to be less than 100 characters', { node: subtitle, property: 'text' });
        }
    }

    checkTimelineElementDurationOnlyForText(te: TimelineElement, accept: ValidationAcceptor): void {
        if (te.duration && !isTextualElement(te.element.ref)) {
            accept('error', 'Only textual elements can have duration', { node: te, property: 'duration' });
        }
    
    }

    checkTimelineElementRelativePlacementOrder(element: RelativeTimelineElement, accept: ValidationAcceptor): void {
        if (element.relativeTo && element.relativeTo.ref) {
            const relativeTo = element.relativeTo.ref;
            if (parseInt(relativeTo.name.slice(1)) > parseInt(element.name.slice(1))) {
                accept('error', 'You cannot place relatively this element to a future element', { node: element, property: 'relativeTo' });
            }
        }
    }

    checkVideoElement(element: VideoElement, accept: ValidationAcceptor): void {
        if (element.videoOption) {
            element.videoOption.forEach((option) => {
                this.checkVideoOption(option, accept);
            });
        }
    }
    
    checkVideoOption(option: VideoOption, accept: ValidationAcceptor): void {
        if (isVideoBrightness(option)) {
            this.checkVideoBrightness(option, accept);
        } else if (isVideoContrast(option)) {
            this.checkVideoContrast(option, accept);
        } else if (isVideoOpacity(option)) {
            this.checkVideoOpacity(option, accept);
        } else if (isVideoResolution(option)) {
            this.checkVideoResolution(option, accept);
        } else if (isVideoScale(option)) {
            this.checkVideoScale(option, accept);
        }
    }
    // Check that the brightness is between valid values
    checkVideoBrightness(option: VideoBrightness, accept: ValidationAcceptor): void {
        if (option.brightness < -5 || option.brightness > 5) {
            accept('error', 'Brightness must be between -5 and 5',
                 { node: option, property: 'brightness' });
        }
    }

    // Check that the contrast is between valid values
    checkVideoContrast(option: VideoContrast, accept: ValidationAcceptor): void {
        if (option.contrast < 0 || option.contrast > 5) {
            accept('error', 'Contrast must be between 0 and 5',                 
                { node: option, property: 'contrast' });
        }
    }

    // Check that the saturation is between valid values
    checkVideoSaturation(option: VideoSaturation, accept: ValidationAcceptor): void {
        if (option.saturation < -1.0 || option.saturation > 1.0) {
            accept('error', 'Saturation must be between -1 and 1. For example, 0.5 is no change',
                 { node: option, property:'saturation' });
        }
    }

    // Check that the contrast is between valid values
    checkVideoOpacity(option: VideoOpacity, accept: ValidationAcceptor): void {
        if (option.opacity < 0.0 || option.opacity > 5.0) {
            accept('error', 'Contrast must be between 0 and 5',
                 { node: option, property: 'opacity' });
        }
    }

    // Check that the resolution is between standard values (FullHD at maximum resolution)
    // TODO : Discuss about the range of the resolution
    checkVideoResolution(option: VideoResolution, accept: ValidationAcceptor): void {
        if(option.resolutionName) {
            const validResolutions = ['webcam'];
            if (!validResolutions.includes(option.resolutionName)) {
                accept('error', 'Resolution must be webcam or x,y', { node: option });
            }
        }
        if(option.width && option.height) {
            if (option.width > 1920 || option.height > 1080 || option.width < 0 || option.height < 0) {
                accept('error', 'Resolution must be less than FullHD (1920x1080) and cannot be negative (Format needed : width , height)', { node: option });
            }

            const ratio = option.width / option.height;
            const optimalRatio = 16 / 9;
            const tolerance = 0.01;

            if (Math.abs(ratio - optimalRatio) > tolerance) {
                accept('warning', 'The resolution is not in 16:9 ratio, which is not optimal for most displays.', { node: option });
            }
        }
    }

    // Check that the scale is between valid values (100% for now, you can only reduce it)
    checkVideoScale(option: VideoScale, accept: ValidationAcceptor): void {
        if (option.scale < 0 || option.scale > 300) {
            accept('error', 'Scale is in %. It cannot be less than 0 or more than 300', { node: option });
        }
    }

    checkVideoPainting(option: VideoPainting, accept: ValidationAcceptor): void {
        if (option.painting > 5 || option.painting < 1) {
            accept('error', 'Painting must be between 1 and 5',
                 { node: option, property: 'painting' });
        }
    }

    // Audio effects ************************************************************************************************
    checkAudioElement(element: AudioElement, accept: ValidationAcceptor): void {
        if (element.audioOptions) {
            element.audioOptions.forEach((option) => {
                this.checkAudioOption(option, accept);
            });
        }
    }

    checkAudioOption(option: AudioOption, accept: ValidationAcceptor): void {
        if (isAudioVolume(option)) {
            this.checkAudioVolume(option, accept);
        } else if (isAudioStereoVolume(option)) {
            this.checkAudioStereoVolume(option, accept);
        }
        else if (isAudioFadeIn(option)) {
            this.checkAudioFadeIn(option, accept);
        }
        else if (isAudioFadeOut(option)) {
            this.checkAudioFadeOut(option, accept);
        }
    }

    checkAudioVolume(option: AudioVolume, accept: ValidationAcceptor): void {
        if (option.volume < 0 || option.volume > 2) {
            accept('error', 'Volume must be between 0 and 2',
                 { node: option, property: 'volume' });
        }
    }

    checkAudioStereoVolume(option: AudioStereoVolume, accept: ValidationAcceptor): void {
        if (option.left < 0 || option.left > 2 || option.right < 0 || option.right > 2) {
            accept('error', 'Stereo volume must be between 0 and 1',
                 { node: option});
        }
    }

    checkAudioFadeIn(option: AudioFadeIn, accept: ValidationAcceptor): void {
        if (option.duration < 0) {
            accept('error', 'Fade in time must be positive',
                 { node: option, property: 'duration' });
        }
    }

    checkAudioFadeOut(option: AudioFadeOut, accept: ValidationAcceptor): void {
        if (option.duration < 0) {
            accept('error', 'Fade out time must be positive',
                 { node: option, property: 'duration' });
        }
    }

    checkVideoTransition(transition: VideoTransition, accept: ValidationAcceptor): void {
        if (transition.type !== 'fadein' && transition.type !== 'fadeout') {
            accept('error', 'Invalid transition type. It must be either fadeIn or fadeOut.',
                 { node: transition, property: 'type' });
        }    
    }
    
}