grammar VideoMl

entry VideoProject:
    'video' 'project' outputName=STRING

    elements+=Element
    (elements+=Element)*


    timelineElements+=TimelineElement*
    (timelineElements+=TimelineElement)*;

Element:
    'load' (Media) 'in' name=ID;

Media:
    (Video);

Video:
    'video' filePath=STRING;

TimelineElement:
    ('add' | '+') element=[Element:ID] 'as' name=ID 'to' 'timeline' (FixedTimelineElement | RelativeTimelineElement) ('in' 'layer' layer=INT)?
    ('with' (Effect | TransitionEffect))*;

FixedTimelineElement:
    {infer FixedTimelineElement}
    'at' startAt=TIME;

RelativeTimelineElement:
    {infer RelativeTimelineElement}
    'at' (StartRelativeTimelineElement | EndRelativeTimelineElement) 'of' relativeTo=[TimelineElement:ID] ('delayed' 'by' offset=RELATIVE_TIME)?;

StartRelativeTimelineElement:
	{infer StartRelativeTimelineElement}
	'start';

EndRelativeTimelineElement:
	{infer EndRelativeTimelineElement}
	'end';

Effect:
    'effect'
        'name' effectName=STRING
        ('brightness' brightness=FLOAT)?
        ('contrast' contrast=FLOAT)?
        ('saturation' saturation=FLOAT)?
        ('opacity' opacity=FLOAT)?
        ('position' position=Point)?
        ('scale' scale=FLOAT)?
        ('blendMode' blendMode=STRING)?
        ('motion' motion=BOOLEAN)?
    ;

TransitionEffect:
    'transition'
        'type' transitionType=STRING
        ('startPoint' startPoint=STRING)?
        ('duration' duration=INT)?
        ('easing' easing=STRING)?
        ('borderWidth' borderWidth=INT)?
        ('borderColor' borderColor=Color)?
        ('overlap' overlap=BOOLEAN)?
    ;

Point:
    'x' '=' x=FLOAT ',' 'y' '=' y=FLOAT;

Color:
    'rgb(' r=INT ',' g=INT ',' b=INT ')';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal RELATIVE_TIME returns string: /[-+][0-5][0-9]:[0-5][0-9]/;
terminal TIME returns string: /[0-5][0-9]:[0-5][0-9]/;
terminal FLOAT: /[0-9]+\.[0-9]+/;
terminal INT returns number: /[0-9]+/;
terminal BOOLEAN returns string: /true|false/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
