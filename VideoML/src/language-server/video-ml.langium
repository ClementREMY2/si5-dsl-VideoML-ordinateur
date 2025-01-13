grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	(groupOptions+=GroupOption)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	(Video | TextualElement) options+=Option* 'in' name=ID;

GroupOption:
	'GroupOption' options+=Option* 'apply' 'to' (elements+=[Element:ID] (',' elements+=[Element:ID])*)?;

Option:
	(VisualElementOption | AudioOption);

VisualElementOption:
	(TextOption | VisualElementBackground | VisualElementPosition | VisualElementSize | VideoOption | TransitionOption);

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

VideoOption: 
       VideoResolution | VideoMotion | VideoFilterType | VideoBlendMode | VideoScale | VideoBrightness | VideoOpacity | VideoContrast | VideoSaturation;

VideoResolution:
       'resolution' width=INT ',' height=INT;

VideoMotion:
       'motion' motion=BOOLEAN;

VideoFilterType:
       'filter' filterType=STRING;

VideoBlendMode:
       'blend' blendMode=STRING;

VideoScale:
       'scale' scale=FLOAT;

VideoBrightness:
       'brightness' brightness=FLOAT;

VideoOpacity:
       'opacity' opacity=FLOAT;

VideoContrast:
       'contrast' contrast=FLOAT;

VideoSaturation:
       'saturation' saturation=FLOAT;

// need to define the targets of the transition, a tuple of two videos
TransitionOption: 
       'transition' 'from' fromVideo=[Video:ID] 'to' toVideo=[Video:ID]
       TransitionType | TransitionOverlap | TransitionStartPoint | TransitionDuration | TransitionBorderWidth | TransitionBorderColor | TransitionEasing;

TransitionType:
       'type' type=STRING;

TransitionOverlap:
       'overlap' overlap=BOOLEAN;

TransitionStartPoint:
       'startpoint' startPoint=STRING;

TransitionBorderColor: 
       'bordercolor' color=STRING;

TransitionBorderWidth:
       'borderwidth' width=INT;

TransitionDuration:
       'duration' duration=INT;

TransitionEasing:
       'easing' easing=STRING;

AudioOption: 
       AudioVolume | AudioNoiseReduction | AudioPitch | AudioFadeOut | AudioFadeIn | AudioReverb | AudioPan | AudioEqualizerSettings;

AudioVolume:
       'volume' volume=FLOAT;

AudioNoiseReduction:
       'noisereduction' noiseReduction=BOOLEAN;

AudioPitch:
       'pitch' pitch=FLOAT;

AudioFadeOut:
       'fadeout' fadeOut=INT;

AudioFadeIn:
       'fadein' fadeIn=INT;

AudioReverb:
       'reverb' reverb=FLOAT;

AudioPan:
       'pan' pan=FLOAT;

AudioEqualizerSettings:
       'equalizer' settings+=FLOAT (',' settings+=FLOAT)*;


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
// FLOAT format: 
terminal FLOAT returns number: /[0-9]*\.[0-9]*/;
// INT format: 0 or non-zero digit followed by zero or more digits
terminal INT returns number: /[0-9]+/;
// BOOLEAN format : true or false
terminal BOOLEAN returns boolean: 'true' | 'false';
// STRING format: "..."
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
