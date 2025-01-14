grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	(groupOptions+=GroupOption)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	(Video | TextualElement | Audio) 'as' name=ID;

Audio:
	(AudioOriginal | AudioExtract);

AudioOriginal:
	'load' 'audio' filePath=STRING;

AudioExtract:
	'extract' 'audio' source=[Audio:ID] 'from' start=TIME 'to' end=TIME;

GroupOption:
	'options' (GroupOptionText | GroupOptionVideo) ;


GroupOptionText:
	options+=(TextOption) (',' options+=TextOption)* 'apply' 'to' (elements+=[TextualElement:ID] (',' elements+=[TextualElement:ID])*)?;

GroupOptionVideo:
	(VisualElementOption) 'apply' 'to' (elements+=[Video:ID] (',' elements+=[Video:ID])*)?; // TODO: Add VideoSpecificOptionn when sam finished the work he add to finish for a while...

VisualElementOption:
	(VisualElementBackground | VisualElementPosition | VisualElementSize);

VisualElementBackground:
	'background' color=STRING;

VisualElementPosition:
	'position' x=INT ',' y=INT;

VisualElementSize:
	'size' width=INT ',' height=INT;


TextSpecificOption:
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
	type=('text' | 'subtitle') text=STRING options+=TextOption*;

TextOption:
	(TextSpecificOption | VisualElementOption);

Video:
	(VideoOriginal | VideoExtract);

VideoOriginal:
	'load' 'video' filePath=STRING;

VideoExtract:
	'extract' 'video' source=[Video:ID] 'from' start=TIME 'to' end=TIME;

TimelineElement:
	name=HASHTAG_ID':' element=[Element:ID] (FixedTimelineElement | RelativeTimelineElement)? ('for' duration=TIME)? (layerPosition=LayerPosition)?;

FixedTimelineElement:
	'at' startAt=TIME;

RelativeTimelineElement:
	'at' place=('start' | 'end') 'of' relativeTo=[TimelineElement:HASHTAG_ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

LayerPosition:
	position=('above' | 'under') relativeTo=[TimelineElement:HASHTAG_ID];

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
