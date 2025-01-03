import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMLAstType,
    Video,
    isFixedTimelineElement,
    TimelineElement,
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
    }

    async checkVideo(video: Video, accept: ValidationAcceptor): Promise<void> {
        await this.checkVideoPath(video, accept);
    }

    checkTimelineElement(element: TimelineElement, accept: ValidationAcceptor): void {
        this.checkTimelineElementLayer(element, accept);
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

    async checkVideoPath(video: Video, accept: ValidationAcceptor): Promise<void> {
        if (!video.filePath) return;

        let errors = [];
        if (!IS_ELECTRON) {
            errors = await validateFilePath(video.filePath);
        } else {
            // Filepath verification will be handled by Electron (main process)
            const indexName = `${video.filePath}-${video.$containerProperty}-${video.$containerIndex}`;
            errors = await invokeFilePathValidator('validate-file', video.filePath, indexName);
        }

        (errors || []).forEach((error: { type: 'error' | 'warning' | 'info' | 'hint', message: string }) => {
            accept(error.type, error.message, { node: video, property: 'filePath' });
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
