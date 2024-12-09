import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    App,
    VideoMlAstType,
} from './generated/ast';
import type { VideoMlServices } from './video-ml-module';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: VideoMlServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.VideoMlValidator;
    const checks: ValidationChecks<VideoMlAstType> = {
        // Check if app name starts with a capital letter
        App: validator.checkApp,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class VideoMlValidator {
    checkApp(app: App, accept: ValidationAcceptor): void {
        // Check if app name starts with a capital letter
        this.checkNothing(app, accept);
    }

    // Check if app name starts with a capital letter
    checkNothing(app: App, accept: ValidationAcceptor): void {
        if (app.name) {
            const firstChar = app.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'App name should start with a capital.', { node: app, property: 'name' });
            }
        }
    }
}
