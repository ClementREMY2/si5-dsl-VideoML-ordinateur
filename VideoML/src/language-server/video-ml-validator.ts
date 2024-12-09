import { ValidationAcceptor, ValidationChecks } from 'langium';
import {
    App,
    VideoMlAstType,
    ComposableString,
    CompositeUnaryExpression,
    Expression,
    isActuator,
    isCompositeBinaryExpression,
    isCompositeUnaryExpression,
    isNestedExpression,
    isPinBrick,
    isScreen,
    isSensor,
    isSensorCondition,
    isTemporalCondition,
    NestedExpression,
    ScreenAction,
    Sensor,
    SensorCondition,
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
        // Check pin allocation with bus
        // Check number of screens
        App: validator.checkApp,
        // Prevent use of multiple "wait" at the same level of a binary expression
        // Prevent use of the same sensor at the same level of a binary expression
        Expression: validator.checkExpresison,
        // Prevent negation of temporal transition
        // Check for double negation
        CompositeUnaryExpression: validator.checkCompositeUnaryExpression,
        // Make sure at least two operands are present in a nested expression
        NestedExpression: validator.checkNestedOperandsLength,
        // Check for length of the screen message
        ScreenAction: validator.checkScreenActionLength,
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
        // Check pin allocation with bus
        this.checkPinBusAllocation(app, accept);
        // Check number of screens
        this.checkNumberOfScreen(app, accept);
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

    // Prevent use of multiple "wait" at the same level of a binary expression
    checkTemporalTransitionCombination(expression: Expression, accept: ValidationAcceptor): void {
        // Count number of temporal transition
        const countTemporalTransition = (expression: Expression): number => {
            let temporalTransitionCount = 0;
            if (isTemporalCondition(expression.operand)) {
                temporalTransitionCount += 1;
            }
            if (isCompositeBinaryExpression(expression)) {
                temporalTransitionCount += countTemporalTransition(expression.rightOperand);
            }
            return temporalTransitionCount;
        };
        
        const count = countTemporalTransition(expression);
        if (count > 1) {
            accept('error', 'Only one temporal transition is allowed.', { node: expression, property: 'operand' });
        }
    }

    // Prevent use of the same sensor at the same level of a binary expression
    checkCompositeUnaryExpression(expr: CompositeUnaryExpression, accept: ValidationAcceptor): void {
        // Prevent negation of temporal transition
        this.checkNegationTemporalTransition(expr, accept);
        // Check for double negation
        this.checkDoubleNegation(expr, accept);
    }

    checkExpresison(expr: Expression, accept: ValidationAcceptor): void {
        // Prevent use of multiple "wait" at the same level of a binary expression
        this.checkTemporalTransitionCombination(expr, accept);
        // Prevent use of the same sensor at the same level of a binary expression
        this.checkSensorCombination(expr, accept);
    }

    checkSensorCombination(expression: Expression, accept: ValidationAcceptor): void {
        const isOperandSensorCondition = isSensorCondition(expression.operand);
        const isExpresionCompositeBinary = isCompositeBinaryExpression(expression);
        if (isOperandSensorCondition && isExpresionCompositeBinary) {
            const containSameSensor = (expression: Expression, sensor: Sensor): boolean => {
                if (isSensorCondition(expression.operand) && expression.operand.sensor.ref === sensor) {
                    return true;
                }
                if (isCompositeBinaryExpression(expression)) {
                    const res = containSameSensor(expression.rightOperand, sensor);
                    if (res) return true;
                }
                return false;
            }

            const sensor = (expression.operand as SensorCondition).sensor.ref;
            if (sensor) {
                const containSame = containSameSensor(expression.rightOperand, sensor);
                if (containSame) {
                    accept('error', 'Same sensor cannot be used twice at the same level of a binary expression.', { node: expression, property: 'operand' });
                }
            }
        }
    }

    // Prevent negation of temporal transition
    checkNegationTemporalTransition(expr: CompositeUnaryExpression, accept: ValidationAcceptor): void {
        const containTemporalTransitions = (expression: Expression): boolean => {
            if (isTemporalCondition(expression.operand)) {
                return true;
            }
            if (isNestedExpression(expression.operand)) {
                const res = containTemporalTransitions(expression.operand.nested);
                if (res) return true;
            }
            if (isCompositeBinaryExpression(expression)) {
                const res = containTemporalTransitions(expression.rightOperand);
                if (res) return true;
            }
            return false;
        }

        const isNegation = expr.operator.operator === 'not';
        if (isNegation) {
            const isInnerTemporal = isTemporalCondition(expr.inner);
            const isNestedContainingTemporals = isNestedExpression(expr.inner) && containTemporalTransitions((expr.inner.nested));

            if (isInnerTemporal || isNestedContainingTemporals) {
                accept('error', 'Negation cannot be applied to temporal transition.', { node: expr, property: 'operator' });
            }
        }
    }

    // Make sure at least two operands are present in a nested expression
    checkNestedOperandsLength(expr: NestedExpression, accept: ValidationAcceptor): void {
        const countOperands = (expression: Expression): number => {
            let operandCount = 1;
            if (isCompositeBinaryExpression(expression)) {
                operandCount += countOperands(expression.rightOperand);
            }
            return operandCount;
        }

        const count = countOperands(expr.nested);
        if (count <= 1) {
            accept('error', 'Nested expression should have at least two operand.', { node: expr, property: 'nested' });
        }
    }

    // Check for double negation
    checkDoubleNegation(expr: CompositeUnaryExpression, accept: ValidationAcceptor): void {
        const isNegation = expr.operator.operator === 'not';
        const isInnerNegation = isCompositeUnaryExpression(expr.inner) && (expr.inner as CompositeUnaryExpression).operator.operator === 'not';

        if (isNegation && isInnerNegation) {
            accept('error', 'Double negation is not allowed.', { node: expr, property: 'operator' });
        }
    }

    // Check for length of the screen message
    checkScreenActionLength(screenAction: ScreenAction, accept: ValidationAcceptor): void {
        const calculateTotalLength = (string: ComposableString): number => {
            let length = string.string.length;

            if (string.sensor) {
                length += 3; // 3 characters for sensor value
            }

            if (string.actuator) {
                length += 3; // 3 characters for actuator value
            }

            if (string.next) {
                length += calculateTotalLength(string.next);
            }

            return length;
        }

        const totalLength = calculateTotalLength(screenAction.value);

        if (totalLength > 32) {
            accept('error', `Screen message should not exceed 32 characters (current length: ${totalLength}).`, { node: screenAction, property: 'value' });
        }
    }

    // Check pin allocation with bus
    checkPinBusAllocation(app: App, accept: ValidationAcceptor): void {
        const getPinPerBus = (bus: string): number[] => {
            if (bus === 'BUS1') return [2,3,4,5,6,7,8];
            if (bus === 'BUS2') return [10,11,12,13,14,15,16];
            if (bus === 'BUS3') return [10,11,12,13,18,19,1];
            return [];
        };

        // Only one bus supported
        const screen = app.bricks.find(isScreen);
        if (screen) {
            const bus = screen.bus.value;
            const allocatedPinsForBus = getPinPerBus(bus);
            const pinBricks = app.bricks.filter(isPinBrick);
            pinBricks.forEach(pinBrick => {
                if (isSensor(pinBrick)) {
                    const pin = pinBrick.inputPin;
                    if (allocatedPinsForBus.includes(pin)) {
                        accept('error', `Pin ${pin} is already allocated to bus ${bus}.`, { node: pinBrick, property: 'inputPin' });
                    }
                } else if (isActuator(pinBrick)) {
                    const pin = pinBrick.outputPin;
                    if (allocatedPinsForBus.includes(pin)) {
                        accept('error', `Pin ${pin} is already allocated to bus ${bus}.`, { node: pinBrick, property: 'outputPin' });
                    }
                }
            });
        }
    }

    // Check number of screens
    checkNumberOfScreen(app: App, accept: ValidationAcceptor): void {
        const screens = app.bricks.filter(isScreen);
        if (screens.length > 1) {
            accept('error', 'Only one screen is supported.', { node: app, property: 'bricks' });
        }
    }
}
