grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

	elements+=Element
	(elements+=Element)*

	(groupOptions+=GroupOption)*

	timelineElements+=TimelineElement
	(timelineElements+=TimelineElement)*;

Element:
	(Video | TextualElement | Audio) 'as' name=ID options+=Option*;

Audio:
	(AudioOriginal | AudioExtract);

AudioOriginal:
	'load' 'audio' filePath=STRING;

AudioExtract:
	'extract' 'audio' source=[Audio:ID] 'from' start=TIME 'to' end=TIME;

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
