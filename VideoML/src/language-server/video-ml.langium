grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	'load' (Media) 'in' name=ID;

Media:
	(Video);

Video:
	'video' filePath=STRING;

TimelineElement:
	'add' element=[Element:ID] 'as' name=ID 'to' 'timeline' (FixedTimelineElement | RelativeTimelineElement) ('in' 'layer' layer=INT)?;

FixedTimelineElement:
	'at' startAt=TIME;

RelativeTimelineElement:
	'at' (StartRelativeTimelineElement | EndRelativeTimelineElement) 'of' relativeTo=[TimelineElement:ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

StartRelativeTimelineElement:
	{infer StartRelativeTimelineElement}
	'start';

EndRelativeTimelineElement:
	{infer EndRelativeTimelineElement}
	'end';

hidden terminal WS: /\s+/;
// ID format: text starting with a letter or underscore followed by zero or more letters, digits or underscores
terminal ID: /[_a-zA-Z][\w_]*/;
// RELATIVE_TIME format: (+|-)TIME
terminal RELATIVE_TIME returns string: /[-+][0-5][0-9]:[0-5][0-9]/;
// TIME format: MM:SS
terminal TIME returns string: /[0-5][0-9]:[0-5][0-9]/;
// INT format: 0 or non-zero digit followed by zero or more digits
terminal INT returns number: /[0-9]+/;
// STRING format: "..."
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
