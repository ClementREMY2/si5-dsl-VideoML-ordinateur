grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	(Video | TextualElement) options+=Option* 'in' name=ID;

Option:
	(VisualElementOption);

VisualElementOption:
	(TextOption | VisualElementBackground | VisualElementPosition | VisualElementSize);

VisualElementBackground:
	'background' color=STRING;

VisualElementPosition:
	'position' x=INT ',' y=INT;

VisualElementSize:
	'size' width=INT ',' height=INT;

TextOption:
	TextFontSize | TextFontColor | TextFont | TextShadow | TextAligment;

TextFontSize:
	'fontsize' size=INT;

TextFontColor:
	'fontcolor' color=STRING;

TextFont:
	'font' name=STRING;

TextShadow:
	'shadow' color=STRING;

TextAligment:
	'alignment' alignment=STRING;

TextualElement:
	(Text | Subtitle);

Text:
	'text' text=STRING;

Subtitle:
	'subtitle' text=STRING;

Video:
	(VideoOriginal | VideoExtract);

VideoOriginal:
	'load' filePath=STRING;

VideoExtract:
	'extract' source=[Video:ID] 'from' start=TIME 'to' end=TIME;

TimelineElement:
	('add' | '+') element=[Element:ID] 'as' name=ID 'to' 'timeline' (FixedTimelineElement | RelativeTimelineElement) ('for' duration=TIME)? ('in' 'layer' layer=INT)?;

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
