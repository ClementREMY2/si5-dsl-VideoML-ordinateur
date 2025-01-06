import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMLAstType,
    isFixedTimelineElement,
    TimelineElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    Video,
    VideoOriginal,
    isVideoOriginal,
    isVideoExtract
} from './generated/ast.js';
import type { VideoMlServices } from './video-ml-module.js';
import { validateFilePath } from './validators/special-validators.js';

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
async function invokeFilePathValidator(command: string, path: string, indexName: string): Promise<any> {
    return new Promise((resolve) => {
        const id = Date.now() + lastId++;
        asyncRequestMap.set(indexName, resolve);

        self.postMessage({
            jsonrpc: "2.0",
            id,
            method: `custom/${command}`,
            params: {
                path,
                indexName,
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
        Video: validator.checkVideo,
        VideoOriginal: validator.checkVideoOriginal,
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

    async checkVideo(video: Video, accept: ValidationAcceptor): Promise<void> {
        await this.checkVideoType(video, accept);
    }

    async checkVideoOriginal(videoOriginal: VideoOriginal, accept: ValidationAcceptor): Promise<void> {
        await this.checkVideoOriginalPath(videoOriginal, accept);
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

    async checkVideoType(video: Video, accept: ValidationAcceptor): Promise<void> {
        if (!(isVideoOriginal) && !(isVideoExtract)) {
            accept('error', 'Video must be of type VideoOriginal or VideoExtract', { node: video, property: 'type' });
        }
    }

    async checkVideoOriginalPath(videoOriginal: VideoOriginal, accept: ValidationAcceptor): Promise<void> {
        if (!videoOriginal.filePath) return;

        let errors = [];
        if (!IS_ELECTRON) {
            errors = await validateFilePath(videoOriginal.filePath);
        } else {
            // Filepath verification will be handled by Electron (main process)
            const indexName = `${videoOriginal.filePath}-${videoOriginal.$containerProperty}-${videoOriginal.$containerIndex}`;
            errors = await invokeFilePathValidator('validate-file', videoOriginal.filePath, indexName);
        }

        (errors || []).forEach((error: { type: 'error' | 'warning' | 'info' | 'hint', message: string }) => {
            accept(error.type, error.message, { node: videoOriginal, property: 'filePath' });
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
