grammar VideoMl

entry App:
	'app' name=ID 'initial' 'state' initial=[State:ID]
	'{'
		'bricks'
		bricks+=Brick
		(bricks+=Brick)* 
		
		'states'
		states+=State
		( states+=State)* 		
	'}';

Brick :
	(PinBrick | BusBrick);

PinBrick:
	(Actuator | Sensor);

BusBrick:
	Screen;

Actuator:
	'Actuator' name=ID ':' outputPin=INT;

Sensor :
	'Sensor'  name=ID ':' inputPin=INT;

Screen:
	'Screen' name=ID ':' bus=Bus;
	
State :
	name=ID '{'
		(actions+=Action)* 
		transitions+=Transition
		(transitions+=Transition)*
	'}';


Action :
	(ActuatorAction | ScreenAction);

ActuatorAction :
	actuator=[Actuator:ID] '<=' value=Signal;

ScreenAction :
	screen=[Screen:ID] '<=' value=ComposableString;

ComposableString:
	string=STRING ('+' sensor=[Sensor:ID])? ('+' actuator=[Actuator:ID])? ('+' next=ComposableString)?;

Transition :
	condition=Expression '=>' next=[State:ID];

Expression:
    operand=PrimaryExpression CompositeBinaryExpression?;

CompositeBinaryExpression:
	operator=BinaryOperator rightOperand=Expression;

PrimaryExpression:
    SensorCondition 
    | TemporalCondition
    | CompositeUnaryExpression
    | NestedExpression;

NestedExpression:
	'(' nested=Expression ')';

BinaryOperator:
	operator=('and' | 'or');

SensorCondition:
    sensor=[Sensor:ID] 'is' value=Signal;

TemporalCondition:
	'wait' time=INT 'ms';

CompositeUnaryExpression:
    operator=UnaryOperator inner=PrimaryExpression;

UnaryOperator:
	operator='not';

Signal:
    value=(HIGH | LOW);
terminal HIGH : 'HIGH';
terminal LOW : 'LOW';

Bus:
	value=(BUS1 | BUS2 | BUS3);
terminal BUS1 : 'BUS1';
terminal BUS2 : 'BUS2';
terminal BUS3 : 'BUS3';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
