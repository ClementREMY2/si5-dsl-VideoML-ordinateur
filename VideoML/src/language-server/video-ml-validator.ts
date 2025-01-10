import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMLAstType,
    isFixedTimelineElement,
    TimelineElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    VideoOriginal,
    VideoExtract,
    isVideoExtract,
    isVideoOriginal,
    Audio,
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
        VideoOriginal: validator.checkVideoOriginal,
        VideoExtract: validator.checkVideoExtract,
        TimelineElement: validator.checkTimelineElement,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class VideoMlValidator {
    checkVideoProject(videoProject: VideoProject, accept: ValidationAcceptor): void {
        this.checkOutputFileName(videoProject, accept);
        this.checkOneTimelineElementAtStart(videoProject, accept);
        this.checkRelativeTimelineElementsInfiniteRecursion(videoProject, accept);
        this.checkUniqueNameForTimelineElements(videoProject, accept);
    }

    async checkAudio(audio: Audio, accept: ValidationAcceptor): Promise<void> {
        await this.checkAudioPath(audio, accept);
        //await this.checkAudioValidTimeCodes(audio, accept);
    }

    //TODO : checkAudioValidTimeCodes? how to proceed?

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
        this.checkTimelineElementLayer(element, accept);
    }

    // Check if all timeline elements have unique names
    checkUniqueNameForTimelineElements(videoProject: VideoProject, accept: ValidationAcceptor): void {
        const names = new Set<string>();
        for (const element of videoProject.timelineElements) {
            if (names.has(element.name)) {
                accept('error', `Name "${element.name}" is already used.`, { node: element, property: 'name' });
            } else {
                names.add(element.name);
            }
        }
    }

    checkRelativeTimelineElementsInfiniteRecursion(videoProject: VideoProject, accept: ValidationAcceptor): void {
        // For each timeline elements, check if we have infinite recursion
        let currentAnalyzingElement: RelativeTimelineElement | null = null;
        let recursivePath: string[] = [];
        const isInfiniteRecursion = (element: RelativeTimelineElement): boolean => {
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
            if (isRelativeTimelineElement(element)) {
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

    async checkAudioPath(audio: Audio, accept: ValidationAcceptor): Promise<void> {
        if (!audio.filePath) return;

        let errors = [];
        if (!IS_ELECTRON) {
            errors = await validateFilePath(audio.filePath);
        } else {
            // Filepath verification will be handled by Electron (main process)
            const indexName = `validate-file-${audio.filePath}-${audio.$containerProperty}-${audio.$containerIndex}`;
            errors = await invokeSpecialCommand(
                'validate-file',
                { path: audio.filePath },
                indexName,
                { needNodeJs: true },
            );
        }

        (errors || []).forEach((error: { type: 'error' | 'warning' | 'info' | 'hint', message: string }) => {
            accept(error.type, error.message, { node: audio, property: 'filePath' });
        });
    }

    // Check if at least one timeline element is present at start
    checkOneTimelineElementAtStart(videoProject: VideoProject, accept: ValidationAcceptor): void {
        if (videoProject.timelineElements.length > 0) {
            const elementAtStart = videoProject.timelineElements.find((element) => isFixedTimelineElement(element) && element.startAt === '00:00');
            if (!elementAtStart) {
                accept('error', 'At least one timeline element must be present at start (00:00)', { node: videoProject, property: 'timelineElements' });
            }
        }
    }

    // Check if layer is not default layer
    checkTimelineElementLayer(element: TimelineElement, accept: ValidationAcceptor): void {
        if (element.layer === 0) {
            accept('error', 'Layer 0 is the default layer, use a number greater than 0 to specify another layer', { node: element, property: 'layer' });
        }
    }
}
