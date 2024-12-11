import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMlAstType,
    Video,
    isFixedTimelineElement,
    TimelineElement,
} from './generated/ast';
import type { VideoMlServices } from './video-ml-module';
import fs from 'fs';
import path from 'path';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: VideoMlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.VideoMlValidator;
    const checks: ValidationChecks<VideoMlAstType> = {
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

    checkVideo(video: Video, accept: ValidationAcceptor): void {
        this.checkVideoPath(video, accept);
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

    checkVideoPath(video: Video, accept: ValidationAcceptor): void {
        // TODO : Make program usable without absolute path
        // Check if path is an absolute path
        if (!path.isAbsolute(video.filePath)) {
            accept('error', 'Video path must be an absolute path', { node: video, property: 'filePath' });
        }

        // Check if file exists
        if (!fs.existsSync(video.filePath)) {
            accept('error', 'Video file not found', { node: video, property: 'filePath' });
        }
    }

    checkOneTimelineElementAtStart(videoProject: VideoProject, accept: ValidationAcceptor): void {
        // Check if at least one timeline element is present at start
        if (videoProject.timelineElements.length > 0) {
            const elementAtStart = videoProject.timelineElements.find((element) => isFixedTimelineElement(element) && element.startAt === '00:00');
            if (!elementAtStart) {
                accept('error', 'At least one timeline element must be present at start (00:00)', { node: videoProject, property: 'timelineElements' });
            }
        }
    }

    checkTimelineElementLayer(element: TimelineElement, accept: ValidationAcceptor): void {
        // Check if layer is not default layer
        if (element.layer === 0) {
            accept('error', 'Layer 0 is the default layer, use a number greater than 0 to specify another layer', { node: element, property: 'layer' });
        }
    }
}
