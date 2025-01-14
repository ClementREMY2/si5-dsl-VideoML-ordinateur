import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
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
        Element: validator.checkElement

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
        if (!videoExtract.start || !videoExtract.end) return;

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
            const indexName = `get-video-original-duration-${source.filePath}-${source.$containerProperty}-${source.$containerIndex}`;
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
        this.checkDuration(element, accept);
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
        if (!audioExtract.start || !audioExtract.end) return;

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
            const indexName = `get-audio-original-duration-${source.filePath}-${source.$containerProperty}-'${source.$containerIndex}'`;
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
    }

    checkTextualElement(element: TextualElement, accept: ValidationAcceptor): void {
        if (element.type === 'subtitle') {
            this.checkSubtitleLength(element, accept);
        }
        if (!element.options) return;
        element.options.forEach((option) => {
            if (isTextFontColor(option)) {
                this.checkColor(option.color, option, 'color', accept);
            } else if(isVisualElementPosition(option) && element.type === 'subtitle') {
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
        });
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

    checkDuration(element: TimelineElement, accept: ValidationAcceptor): void {
        if (element.duration && isVideoElement(element.element.ref)) {
            accept('error', 'Duration is not allowed in video elements, please create an extract.', { node: element , property: 'duration' });
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
}