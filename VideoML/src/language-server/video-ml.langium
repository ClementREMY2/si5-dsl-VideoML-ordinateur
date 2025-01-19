grammar VideoMl

entry VideoProject:
	'video' 'project' outputName=STRING

    (elements+=Element)+

	(groupOptions+=GroupOption)*

	(timelineElements+=TimelineElement)+;


// Element
Element:
	(VideoElement | TextualElement | AudioElement) 'as' name=ID;

// Video element
VideoElement:
	(VideoOriginal | VideoExtract)
	(options+=VideoOption)*;

VideoOriginal:
	'load' 'video' filePath=STRING;

VideoExtract:
	'extract' 'video' source=[VideoElement:ID] 'from' start=TIME 'to' end=TIME;

// Textual element
TextualElement:
	(Text | Subtitle) text=STRING
	(options+=TextOption)*;

Subtitle:
	{infer Subtitle}
	'subtitle';

Text:
	{infer Text}
	'text';

// Audio element
AudioElement:
	(AudioOriginal | AudioExtract)
	(options+=AudioOption)*;

AudioOriginal:
	'load' 'audio' filePath=STRING;

AudioExtract:
	'extract' 'audio' source=[AudioElement:ID] 'from' start=TIME 'to' end=TIME;

// Group options
GroupOption:
	'options' (GroupOptionText | GroupOptionVideo | GroupOptionAudio);

GroupOptionText:
	options+=TextOption (',' options+=TextOption)* 'apply' 'to' elements+=[TextualElement:ID] (',' elements+=[TextualElement:ID])*;

GroupOptionVideo:
	options+=VideoOption (',' options+=VideoOption)* 'apply' 'to' elements+=[VideoElement:ID] (',' elements+=[VideoElement:ID])*;

GroupOptionAudio:
	options+=AudioOption (',' options+=AudioOption)* 'apply' 'to' elements+=[AudioElement:ID] (',' elements+=[AudioElement:ID])*;

// Visual element options (used by VideoOption and TextOption)
VisualElementOption:
	(VisualElementBackground | VisualElementPosition | VisualElementSize);

VisualElementBackground:
	'background' color=STRING;

VisualElementPosition:
	'position' (VisualElementPositionAlignment | VisualElementPositionCoordinates);

VisualElementPositionAlignment:
	alignmentX=ALIGNMENT ',' alignmentY=ALIGNMENT;

VisualElementPositionCoordinates:
	x=INT ',' y=INT;

VisualElementSize:
	'size' (VisualElementSizePixels | VisualElementSizeResolution);

VisualElementSizePixels:
	width=INT ',' height=INT;

VisualElementSizeResolution:
	resolution=STRING;

// Video options
VideoOption:
	(VideoSpecificOption | VisualElementOption);

VideoSpecificOption: 
	(VideoContrast | VideoSaturation | VideoBrightness | VideoOpacity  | VideoScale | VideoRotation | VideoTransition);

VideoContrast:
	'contrast' contrast=FLOAT;

VideoBrightness:
	'brightness' brightness=INT;

VideoSaturation:
	'saturation' saturation=FLOAT;

VideoOpacity:
	'opacity' opacity=FLOAT;

VideoScale:
	'scale' scale=FLOAT;

VideoRotation:
	'rotation' rotation=INT;

VideoTransition:
     type=VIDEO_TRANSITION_TYPE;

// Text options
TextOption:
	(TextSpecificOption | VisualElementOption);

TextSpecificOption:
	TextFontSize | TextFontColor | TextFont;

TextFontSize:
	'fontsize' size=INT;

TextFontColor:
	'fontcolor' color=STRING;

TextFont:
	'font' name=STRING;

// Audio options
AudioOption:
	(AudioFadeIn | AudioFadeOut | AudioVolume | AudioStereoVolume | AudioDelay | AudioNormalize);

AudioNormalize:
	{infer AudioNormalize}
	'normalize';

AudioDelay:
	'delay' delay=FLOAT ',' 'repetitions' repetitions=INT;

AudioFadeIn:
	'fadeIn' duration=INT;

AudioFadeOut:
	'fadeOut' duration=INT;

AudioVolume:
	'volume' volume=FLOAT;

AudioStereoVolume:
	'stereo' 'left' left=FLOAT 'right' right=FLOAT;

// Timeline
TimelineElement:
	name=HASHTAG_ID':' element=[Element:ID] (FixedTimelineElement | RelativeTimelineElement)? ('for' duration=TIME)? (layerPosition=LayerPosition)?;

FixedTimelineElement:
	'at' startAt=TIME;

RelativeTimelineElement:
	'at' place=RELATIVE_PLACEMENT 'of' relativeTo=[TimelineElement:HASHTAG_ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

LayerPosition:
	position=LAYER_PLACEMENT relativeTo=[TimelineElement:HASHTAG_ID];

//************* ENUMS **************** 

terminal VIDEO_TRANSITION_TYPE: 'fadeout' | 'fadein';

terminal ALIGNMENT: '"center"' | '"left"' | '"right"' | '"top"' | '"bottom"';

terminal RELATIVE_PLACEMENT: 'start' | 'end';

terminal LAYER_PLACEMENT: 'above' | 'under';

//************* TERMINALS **************** 

hidden terminal WS: /\s+/;
// Hashtag ID forma
terminal HASHTAG_ID returns string: /#[0-9]+/;
// ID format: text starting with a letter or underscore followed by zero or more letters, digits or underscores
terminal ID: /[_a-zA-Z][\w_]*/;
// RELATIVE_TIME format: (+|-)TIME
terminal RELATIVE_TIME returns string: /[-+][0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?/;
// TIME format: MM:SS or MM:SS.mmm
terminal TIME returns string: /[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?/;
// FLOAT format : 0 or non-zero digit followed by zero or more digits
terminal FLOAT returns number: /-?[0-9]*\.[0-9]+/;
// INT format: 0 or non-zero digit followed by zero or more digits
terminal INT returns number: /-?[0-9]+/;
// STRING format: "..."
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
