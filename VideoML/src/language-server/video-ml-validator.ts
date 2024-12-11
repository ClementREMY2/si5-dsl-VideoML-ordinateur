import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    VideoProject,
    VideoMlAstType,
    Video,
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
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class VideoMlValidator {
    checkVideoProject(videoProject: VideoProject, accept: ValidationAcceptor): void {
        this.checkOutputFileName(videoProject, accept);
    }

    checkVideo(video: Video, accept: ValidationAcceptor): void {
        this.checkVideoPath(video, accept);
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
        if (!path.isAbsolute(video.path)) {
            accept('error', 'Video path must be an absolute path', { node: video, property: 'path' });
        }

        // Check if file exists
        if (!fs.existsSync(video.path)) {
            accept('error', 'Video file not found', { node: video, property: 'path' });
        }
    }
}
