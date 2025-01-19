import { AstNode, Reference, ValidationAcceptor, ValidationChecks } from 'langium';
import { nanoid } from 'nanoid';
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
    isTextFontSize,
    TextFont,
    TextualElement,
    VideoBrightness,
    VideoContrast,
    VideoOpacity,
    VideoScale,
    VideoRotation,
    VideoElement,
    isVideoBrightness,
    isVideoContrast,
    isVideoOpacity,
    isVideoScale,
    isVideoRotation,
    VideoSaturation,
    AudioVolume,
    AudioStereoVolume,
    AudioFadeIn,
    AudioFadeOut,
    AudioDelay,
    AudioElement,
    isAudioVolume,
    isAudioStereoVolume,
    isAudioFadeIn,
    isAudioFadeOut,
    isAudioDelay,
    isAudioElement,
    VideoTransition,
    GroupOption,
    isGroupOptionVideo,
    isGroupOptionAudio,
    isGroupOptionText,
    TextOption,
    VideoOption,
    AudioOption,
    isSubtitle,
} from './generated/ast.js';
import type { VideoMlServices } from './video-ml-module.js';
import { validateFilePath } from './validators/special-validators.js';
import { getLayer, getTimelineElementTextualDuration, helperOffsetTimeToSeconds, helperTimeToSeconds } from '../lib/helper.js';

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

// Function to simulate synchronous calls from worker to renderer process in Electron
async function invokeSpecialCommand(
    command: string,
    commandParams: object,
    executionParams: {
        needNodeJs: boolean;
    },
): Promise<any> {
    return new Promise((resolve, reject) => {
        const id = nanoid();
        asyncRequestMap.set(id, resolve);

        self.postMessage({
            jsonrpc: "2.0",
            id,
            method: `custom/${command}`,
            params: {
                commandParams,
                indexName: id,
                executionParams,
            },
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            if (asyncRequestMap.has(id)) {
                asyncRequestMap.delete(id);
                reject(new Error(`Command ${command} timed out`));
            }
        }, 5000);
    });
}

async function getAudioDuration (audioPath: string): Promise<number> {
    return await invokeSpecialCommand(
        'get-audio-original-duration',
        { path: audioPath },
        { needNodeJs: false },
    );
}

async function getVideoDuration (videoPath: string): Promise<number> {
    return await invokeSpecialCommand(
        'get-video-original-duration',
        { path: videoPath },
        { needNodeJs: false },
    );
}

const getTimelineElementPopulated = async (element: TimelineElement, timelineElementList: TimelineElement[]): Promise<{ calculatedStartAt?: number, calculatedDuration?: number, calculatedFinishAt?: number, layer?: number }> => {
    if (!element.name || !element.element?.ref) return {};

    // Get layer
    let layer = undefined;
    if (element.layerPosition?.relativeTo?.ref) {
        layer = getLayer(element);
    }
    
    // Calculate duration
    let duration = 0;
    if (isTextualElement(element.element.ref)) {
        duration = helperTimeToSeconds(getTimelineElementTextualDuration(element.duration));
    }
    if (isAudioExtract(element.element.ref)) {
        duration = helperTimeToSeconds(element.element.ref.end) - helperTimeToSeconds(element.element.ref.start);
    }
    if (isVideoExtract(element.element.ref)) {
        duration = helperTimeToSeconds(element.element.ref.end) - helperTimeToSeconds(element.element.ref.start);
    }
    if (isAudioOriginal(element.element.ref)) {
        duration = await getAudioDuration(element.element.ref.filePath);
    }
    if (isVideoOriginal(element.element.ref)) {
        duration = await getVideoDuration(element.element.ref.filePath);
    }

    // Calculate start at & finish at
    if (isFixedTimelineElement(element)) {
        const startAt = helperTimeToSeconds(element.startAt)
        return {
            calculatedStartAt: startAt,
            calculatedDuration: duration,
            calculatedFinishAt: startAt + duration,
            layer,
        };
    }
    if (isRelativeTimelineElement(element)) {
        const relativeToElement = element.relativeTo?.ref;
        if (!relativeToElement) {
            return {
                calculatedStartAt: 0,
                calculatedDuration: duration,
                calculatedFinishAt: duration,
                layer,
            };
        }

        const isRelativeOrderCorrect = parseInt(relativeToElement.name.slice(1)) < parseInt(element.name.slice(1));
        if (!isRelativeOrderCorrect) return { layer };
    
        const { calculatedStartAt: relativeStartAt, calculatedDuration: relativeDuration } = await getTimelineElementPopulated(relativeToElement, timelineElementList);
    
        const offset = helperOffsetTimeToSeconds(element.offset);
    
        const startAt = (relativeStartAt || 0) + offset + (element.place === 'end' ? (relativeDuration || 0) : 0);

        return {
            calculatedStartAt: startAt,
            calculatedDuration: duration,
            calculatedFinishAt: startAt + duration,
            layer,
        };
    }

    // Implicit timeline element
    if (element.$containerIndex === 0) {
        return {
            calculatedStartAt: 0,
            calculatedDuration: duration,
            calculatedFinishAt: duration,
            layer,
        }
    }
    const previousElement = timelineElementList[(element.$containerIndex || 1) - 1];
    const previousElementInfo = await getTimelineElementPopulated(previousElement, timelineElementList);
    return {
        calculatedStartAt: previousElementInfo.calculatedFinishAt || 0,
        calculatedDuration: duration,
        calculatedFinishAt: (previousElementInfo.calculatedFinishAt || 0) + duration,
        layer,
    };
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
    async checkVideoProject(videoProject: VideoProject, accept: ValidationAcceptor): Promise<void> {
        this.checkOutputFileName(videoProject, accept);
        this.checkTimelineElementAtStart(videoProject, accept);
        this.checkRelativeTimelineElementsInfiniteRecursion(videoProject, accept);
        this.checkLayerTimelineElementsInfiniteRecursion(videoProject, accept);
        this.checkNameForTimelineElements(videoProject, accept);
        this.checkNameForElements(videoProject, accept);
        await this.checkTimelineElementsTimePlacement(videoProject.timelineElements, accept);
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

    async checkTimelineElementsTimePlacement(timelineElementList: TimelineElement[], accept: ValidationAcceptor): Promise<void> {
        // Populate each timeline element with some useful info
        const populatedTimeTimelineElements = await Promise.all(
            timelineElementList.map(async (element) => {
                const info = await getTimelineElementPopulated(element, timelineElementList);
                return {
                    ...element,
                    ...info,
                };
            })
        );
        
        // Check if for all relative timeline elements, the startAt is not negative
        populatedTimeTimelineElements.forEach((element) => {
            if ((element.calculatedStartAt || 0) < 0) {
                accept('error', 'This timeline element will start before the beginning of the video, which is not allowed', { node: element });
            }
        });

        // Check if some timeline elements that are on the same layer might overlap
        populatedTimeTimelineElements.forEach((fromElement) => {
            populatedTimeTimelineElements.forEach((toElement) => {
                if (fromElement.name === toElement.name) return;
                if (fromElement.layer !== toElement.layer) return;

                const isToStartInsideFrom = ((fromElement.calculatedStartAt || 0) < (toElement.calculatedStartAt || 0) && (toElement.calculatedStartAt || 0) < (fromElement.calculatedFinishAt || 0));
                const isToEndInsideFrom = ((fromElement.calculatedStartAt || 0) < (toElement.calculatedFinishAt || 0) && (toElement.calculatedFinishAt || 0) < (fromElement.calculatedFinishAt || 0));

                if (isToStartInsideFrom || isToEndInsideFrom) {
                    accept('warning', `This element is overlapping with ${toElement.name} on the same layer`, { node: fromElement });
                }
            });
        });
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
            duration = await getVideoDuration(source.filePath);
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
            errors = await invokeSpecialCommand(
                'validate-file',
                { path: videoOriginal.filePath },
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
            errors = await invokeSpecialCommand(
                'validate-file',
                { path: audioOriginal.filePath },
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
            duration = await getAudioDuration(source.filePath);
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
        if (isSubtitle(element)) {
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
        } else if(isVisualElementPosition(option) && isSubtitle(element)) {
            accept('error', 'Position is not allowed in subtitle elements', { node: option });
        } else if (isTextFont(option)) {
            this.checkFontSetting(option, accept);
        } else if (isTextFont(option)) {
            this.checkFontSetting(option, accept);
        } else if (isTextFontSize(option)) {
            if (option.size < 0 || option.size > 128) {
                accept('error', 'Font size must be between 0 and 128', { node: option, property: 'size' });
            }
        }
    }

    checkFontSetting(fontSetting: TextFont, accept: ValidationAcceptor): void {
        const validFonts = ['Arial', 'Calibri', 'Verdana', 'Georgia', 'Elephant', 'Book Antiqua', 'Gadugi', 'Garamond', 'Ebrima', 'Impact'];
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
        } else if (isVideoScale(option)) {
            this.checkVideoScale(option, accept);
        } else if (isVideoRotation(option)) {
            this.checkVideoRotation(option, accept);
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

    // Check that the scale is between valid values (100% for now, you can only reduce it)
    checkVideoScale(option: VideoScale, accept: ValidationAcceptor): void {
        if (option.scale > 1.0 || option.scale < 0.0) {
            accept('error', 'Scale is a coefficiant between 0 and 1', { node: option });
        }
    }

    checkVideoRotation(option: VideoRotation, accept: ValidationAcceptor): void {
        if (option.rotation < 0 || option.rotation > 360) {
            accept('error', 'Rotation must be between 0 and 360', { node: option });
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
        else if (isAudioDelay(option)) {
            this.checkAudioDelay(option, accept);
        }
    }

    checkAudioVolume(option: AudioVolume, accept: ValidationAcceptor): void {
        if (option.volume < 0 || option.volume > 2) {
            accept('error', 'Volume must be between 0 and 2. 1 is no change',
                 { node: option, property: 'volume' });
        }
    }

    checkAudioStereoVolume(option: AudioStereoVolume, accept: ValidationAcceptor): void {
        if (option.left < 0.0 || option.left > 2.0) {
            accept('error', 'Stereo volume must be between 0 and 2. 1 is no change',
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

    checkAudioDelay(option: AudioDelay, accept: ValidationAcceptor): void {
        if (option.repetitions < 0) {
            accept('error', 'Number of repetitions must be positive',
                 { node: option, property: 'repetitions' });
        }
        else if (option.delay < 0) {
            accept('error', 'Delay time must be positive',
                 { node: option, property: 'delay' });
        }
    }
}