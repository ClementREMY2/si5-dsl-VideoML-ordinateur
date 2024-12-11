grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING
	elements+=Element
	(elements+=Element)*;

Element:
	(Media);

Media:
	(Video);

Video:
	'load' 'video' path=STRING 'in' name=ID;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
