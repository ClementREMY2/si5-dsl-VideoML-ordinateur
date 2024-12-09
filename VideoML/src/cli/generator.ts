import fs from 'fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import {
	Action,
	Actuator,
	App,
	Sensor,
	State,
	Transition,
	Expression,
	isSensorCondition,
	SensorCondition,
	isTemporalCondition,
	TemporalCondition,
	isCompositeBinaryExpression,
	CompositeUnaryExpression,
	isCompositeUnaryExpression,
	PrimaryExpression,
	NestedExpression,
	isNestedExpression,
	isPinBrick,
	isSensor,
	isActuator,
	ActuatorAction,
	isActuatorAction,
	isScreenAction,
	ScreenAction,
	isScreen,
	Screen,
	isBusBrick,
	ComposableString,
} from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

export function generateInoFile(app: App, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.ino`;

    const fileNode = new CompositeGeneratorNode();
    compile(app,fileNode)
    
    
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}


function compile(app:App, fileNode:CompositeGeneratorNode){
    fileNode.append(
	`
//Wiring code generated from an VideoML model
// Application name: `+app.name, NL);

	// Only one screen is supported
	const screen = app.bricks.find(isScreen);
	if (screen) {
		compileScreenDeclaration(screen, fileNode);
	}	

	fileNode.append(`
long debounce = 200;
enum STATE {`+app.states.map(s => s.name).join(', ')+`};

STATE currentState = `+app.initial.ref?.name+`;`
    ,NL);
	
    for(const brick of app.bricks){
        if ("inputPin" in brick){
            fileNode.append(`
bool `+brick.name+`BounceGuard = false;
long `+brick.name+`LastDebounceTime = 0;
            `,NL);
        }
    }

	// State entry time for temporal transitions
	fileNode.append(`
long stateEntryTime = 0;
	`, NL);

	// Update screen variable
	fileNode.append(`
bool screenUpdated = false;
	`, NL);

    fileNode.append(`
	void setup(){`);

    for(const brick of app.bricks){
		if (isPinBrick(brick)) {
			if (isSensor(brick)) {
				   compileSensor(brick,fileNode);
			} else if (isActuator(brick)) {
				compileActuator(brick,fileNode);
			}
		} else if (isBusBrick(brick)) {
			if (isScreen(brick)) {
				compileScreen(brick,fileNode);
			}
		}
	}


    fileNode.append(`
	}
	void loop() {
		long currentTime = millis();
			switch(currentState){`,NL)
			for(const state of app.states){
				compileState(state, fileNode)
            }
	fileNode.append(`
		}
	}
	`,NL);




    }

	function compileScreenDeclaration(screen: Screen, fileNode: CompositeGeneratorNode) {
		fileNode.append(`
#include <LiquidCrystal.h>
		`, NL);

		switch (screen.bus.value) {
			case 'BUS1':
				fileNode.append(`
LiquidCrystal lcd(2, 3, 4, 5, 6, 7, 8);
				`, NL);
				break;
			case 'BUS2':
				fileNode.append(`
LiquidCrystal lcd(10, 11, 12, 13, 14, 15, 16);
				`, NL);
				break;
			case 'BUS3':
				fileNode.append(`
LiquidCrystal lcd(10, 11, 12, 13, 18, 19, 1);
				`, NL);
				break;
		}
	}

	function compileActuator(actuator: Actuator, fileNode: CompositeGeneratorNode) {
        fileNode.append(`
		pinMode(`+actuator.outputPin+`, OUTPUT); // `+actuator.name+` [Actuator]`)
    }

	function compileSensor(sensor:Sensor, fileNode: CompositeGeneratorNode) {
    	fileNode.append(`
		pinMode(`+sensor.inputPin+`, INPUT); // `+sensor.name+` [Sensor]`)
	}

	function compileScreen(screen: Screen, fileNode: CompositeGeneratorNode) {
		fileNode.append(`
		// Screen setup
		lcd.begin(16, 2);`);
	}

    function compileState(state: State, fileNode: CompositeGeneratorNode) {
        fileNode.append(`
				case `+state.name+`:`)
		for(const action of state.actions){
			compileAction(action, fileNode)
		}
		if (state.transitions !== null){
			state.transitions.forEach(transition => compileTransition(transition, fileNode));
		}
		fileNode.append(`
				break;`)
    }
	

	function compileAction(action: Action, fileNode:CompositeGeneratorNode) {
		if (isActuatorAction(action)) {
			compileActuatorAction(action, fileNode);
		} else if (isScreenAction(action)) {
			compileScreenAction(action, fileNode);
		}
	}

	function compileActuatorAction(action: ActuatorAction, fileNode: CompositeGeneratorNode) {
		fileNode.append(`
					digitalWrite(`+action.actuator.ref?.outputPin+`,`+action.value.value+`);`)
	}

	function compileScreenAction(action: ScreenAction, fileNode: CompositeGeneratorNode) {
		const generateString = (composableString: ComposableString) => {
			// create string declaration
			let res = "\"" + composableString.string + "\"";

			if (composableString.sensor) {
				res += ` + String(digitalRead(` + composableString.sensor.ref?.inputPin + `) == HIGH ? "ON" : "OFF")`;
			}

			if (composableString.actuator) {
				res += ` + String(digitalRead(` + composableString.actuator.ref?.outputPin + `) == HIGH ? "ON" : "OFF")`;
			}

			if (composableString.next) {
				res += ' + ' + generateString(composableString.next);
			}

			return res;
		};


		fileNode.append(`
					if (!screenUpdated) {
						lcd.clear();
						String msg = ${generateString(action.value)};
						String firstLine = msg.substring(0, 16);
						String secondLine = msg.substring(16, 32);
						lcd.setCursor(0, 0);
						lcd.print(firstLine);
						lcd.setCursor(0, 1);
						lcd.print(secondLine);
						screenUpdated = true;
					}`
		);
	}

	function compileTransition(transition: Transition, fileNode: CompositeGeneratorNode) {
		const sensors = getAllUniqueSensors(transition.condition);
		compileDebouneGuard(sensors, fileNode);

		if (sensors.length > 0) {
			fileNode.append(`
					if (${sensors.map(sensor => `${sensor.name}BounceGuard`).join(' && ')}) {`);
		}

		fileNode.append(`
						if (`);


		compileExpression(transition.condition, fileNode);


		fileNode.append(`) {
							currentState = ${transition.next.ref?.name};
							screenUpdated = false;
							stateEntryTime = millis();`);
		compileDebounceTime(sensors, fileNode);

		fileNode.append(`
						}`);

		
		if (sensors.length > 0) {
			fileNode.append(`
					}`);
		}
	}


	function compileExpression(expr: Expression, fileNode: CompositeGeneratorNode) {
		compilePrimaryExpression(expr.operand, fileNode);
		if (isCompositeBinaryExpression(expr)) {
			const isAnd = expr.operator.operator === 'and';
			fileNode.append(isAnd ? ' && ' : ' || ');
			compileExpression(expr.rightOperand, fileNode);
		}
	}

	function compilePrimaryExpression(expr: PrimaryExpression, fileNode: CompositeGeneratorNode) {
		if (isSensorCondition(expr)) {
			compileSensorCondition(expr, fileNode);
		} else if (isTemporalCondition(expr)) {
			compileTemporalCondition(expr, fileNode);
		} else if (isCompositeUnaryExpression(expr)) {
			compileCompositeUnaryExpression(expr, fileNode);
		} else if (isNestedExpression(expr)) {
			compileNestedExpression(expr, fileNode);
		}
	}

	function compileSensorCondition(condition: SensorCondition, fileNode: CompositeGeneratorNode) {
		fileNode.append(`digitalRead(${condition.sensor.ref?.inputPin}) == ${condition.value.value}`);
	}

	function compileNestedExpression(expr: NestedExpression, fileNode: CompositeGeneratorNode) {
		fileNode.append(`(`);
		compileExpression(expr.nested, fileNode);
		fileNode.append(`)`);
	}

	function getAllUniqueSensors(expr: Expression): Sensor[] {
		const sensors: Sensor[] = [];
		if (isSensorCondition(expr.operand)) {
			const sensorCondition = expr.operand as SensorCondition;
			if (sensorCondition.sensor.ref) sensors.push(sensorCondition.sensor.ref);
		}
		if (isCompositeBinaryExpression(expr)) {
			sensors.push(...getAllUniqueSensors(expr.rightOperand));
		}
		if (isNestedExpression(expr.operand)) {
			sensors.push(...getAllUniqueSensors((expr.operand as NestedExpression).nested));
		}
		if (isCompositeUnaryExpression(expr.operand) && isSensorCondition((expr.operand as CompositeUnaryExpression).inner)) {
			const sensorCondition = (expr.operand as CompositeUnaryExpression).inner as SensorCondition;
			if (sensorCondition.sensor.ref) sensors.push(sensorCondition.sensor.ref);
		}
		// Set to remove duplicates
		return [...new Set(sensors)];
	}

	function compileDebouneGuard(sensors: Sensor[], fileNode: CompositeGeneratorNode) {
		for (const sensor of sensors) {
			fileNode.append(`
					${sensor.name}BounceGuard = millis() - ${sensor.name}LastDebounceTime > debounce;`);
		}
	}

	function compileDebounceTime(sensors: Sensor[], fileNode: CompositeGeneratorNode) {
		for (const sensor of sensors) {
			fileNode.append(`
							${sensor.name}LastDebounceTime = millis();`);
		}
	}

	function compileTemporalCondition(condition: TemporalCondition, fileNode: CompositeGeneratorNode) {
		fileNode.append(`(currentTime - stateEntryTime >= ${condition.time})`);
	}

	function compileCompositeUnaryExpression(expr: CompositeUnaryExpression, fileNode: CompositeGeneratorNode) {
		const isNegation = expr.operator.operator === 'not';
		const operator = isNegation ? '!' : '';
		fileNode.append(`${operator}(`);
		compilePrimaryExpression(expr.inner, fileNode);
		fileNode.append(`)`);
	}
