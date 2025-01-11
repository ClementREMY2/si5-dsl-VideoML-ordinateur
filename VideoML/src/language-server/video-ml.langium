grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	(Media) 'as' name=ID;

Media:
	(Video);

Video:
	'load' filePath=STRING;

TimelineElement:
	name=HASHTAG_ID':' element=[Element:ID] (FixedTimelineElement | RelativeTimelineElement)? ('in' 'layer' layer=INT)?;

FixedTimelineElement:
	'at' startAt=TIME;

RelativeTimelineElement:
	'at' (StartRelativeTimelineElement | EndRelativeTimelineElement) 'of' relativeTo=[TimelineElement:HASHTAG_ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

StartRelativeTimelineElement:
	{infer StartRelativeTimelineElement}
	'start';

EndRelativeTimelineElement:
	{infer EndRelativeTimelineElement}
	'end';

hidden terminal WS: /\s+/;
// Hashtag ID forma
terminal HASHTAG_ID returns string: /#[0-9]+/;
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
