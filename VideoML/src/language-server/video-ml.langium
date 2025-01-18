grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

        (elements+=Element)+

	(groupOptions+=GroupOption)*

	(timelineElements+=TimelineElement)+;


Element:
	(VideoElement | TextualElement | AudioElement) 'as' name=ID;


AudioElement:
	(AudioOriginal | AudioExtract)
	audioOptions+=AudioOption*;

AudioOriginal:
	'load' 'audio' filePath=STRING;

AudioExtract:
	'extract' 'audio' source=[AudioElement:ID] 'from' start=TIME 'to' end=TIME;

GroupOption:
	'options' (GroupOptionText | GroupOptionVideo | GroupOptionAudio);

GroupOptionText:
	options+=(TextOption) (',' options+=TextOption)* 'apply' 'to' (elements+=[TextualElement:ID] (',' elements+=[TextualElement:ID])*)?;

GroupOptionVideo:
	options+=(VisualElementOption | VideoSpecificOption) (',' options+=(VisualElementOption | VideoSpecificOption))* 'apply' 'to' (elements+=[VideoElement:ID] (',' elements+=[VideoElement:ID])*)?;

GroupOptionAudio:
	options+=(AudioOption) (',' options+=AudioOption)* 'apply' 'to' (elements+=[AudioElement:ID] (',' elements+=[AudioElement:ID])*)?;	

VisualElementOption:
	(VisualElementBackground | VisualElementPosition | VisualElementSize);

VisualElementBackground:
	'background' color=STRING;

VisualElementPosition:
	'position' x=INT ',' y=INT;

VisualElementSize:
	'size' width=INT ',' height=INT;

TextSpecificOption:
	TextFontSize | TextFontColor | TextFont | TextShadow | TextAligment  | TextEffect;

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

TextEffect:
	type=('grouping'| 'falling');

TextualElement:
	type=('text' | 'subtitle') text=STRING options+=TextOption*;

TextOption:
	(TextSpecificOption | VisualElementOption);

VideoElement:
	(VideoOriginal | VideoExtract)
	videoOption+=VideoOption*;

VideoOriginal:
	'load' 'video' filePath=STRING;

VideoExtract:
	'extract' 'video' source=[VideoElement:ID] 'from' start=TIME 'to' end=TIME;

TimelineElement:
	name=HASHTAG_ID':' element=[Element:ID] (FixedTimelineElement | RelativeTimelineElement)? ('for' duration=TIME)? (layerPosition=LayerPosition)?;

FixedTimelineElement:
	'at' startAt=TIME;

RelativeTimelineElement:
	'at' place=('start' | 'end') 'of' relativeTo=[TimelineElement:HASHTAG_ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

LayerPosition:
	position=('above' | 'under') relativeTo=[TimelineElement:HASHTAG_ID];

// Video options

VideoOption:
	(VideoSpecificOption | VisualElementOption);

VideoSpecificOption: 
	(VideoContrast | VideoSaturation | VideoBrightness | VideoOpacity | VideoResolution | VideoScale | VideoPainting | VideoRotation | VideoTransition);

VideoContrast:
	'contrast' contrast=FLOAT;

VideoBrightness:
	'brightness' brightness=INT;

VideoSaturation:
	'saturation' saturation=FLOAT;

VideoOpacity:
	'opacity' opacity=FLOAT;

VideoResolution:
	'resolution' width=INT ',' height=INT;

VideoScale:
	'scale' scale=INT;

VideoPainting:
	'painting' painting=INT;

VideoRotation:
	'rotation' rotation=INT;

// Video transition

VideoTransition:
     type=('fadeout' | 'fadein');

// Audio options 

AudioOption:
	(AudioFadeIn | AudioFadeOut | AudioVolume | AudioStereoVolume | 'normalize');

AudioFadeIn:
	'fadeIn' duration=INT;

AudioFadeOut:
	'fadeOut' duration=INT;

AudioVolume:
	'volume' volume=FLOAT;

AudioStereoVolume:
	'stereo' 'left' left=FLOAT 'right' right=FLOAT;

//************* TERMINALS **************** 

hidden terminal WS: /\s+/;
// Hashtag ID forma
terminal HASHTAG_ID returns string: /#[0-9]+/;
// ID format: text starting with a letter or underscore followed by zero or more letters, digits or underscores
terminal ID: /[_a-zA-Z][\w_]*/;
// RELATIVE_TIME format: (+|-)TIME
terminal RELATIVE_TIME returns string: /[-+][0-5][0-9]:[0-5][0-9]/;
// TIME format: MM:SS
terminal TIME returns string: /[0-5][0-9]:[0-5][0-9]/;
// FLOAT format : 0 or non-zero digit followed by zero or more digits
terminal FLOAT returns number: /[0-9]*\.[0-9]+/;
// INT format: 0 or non-zero digit followed by zero or more digits
terminal INT returns number: /[0-9]+/;
// STRING format: "..."
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
