import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    Element,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    isEndRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    isText,
    isSubtitle,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
    isVideo,
    Video,
    isTextFontSize,
    isTextFontColor,
    isTextFont,
    isTextAligment,
    isVisualElementBackground,
    isVisualElementSize,
    isVisualElementPosition,
    isTextualElement,
    TextualElement,
    GroupOption,
    VisualElementOption,
    isVisualElementOption,
    isTransitionOption,
    isTextOption,
    isVideoBrightness,
    Option,
    isVideoScale,
    isVideoOpacity,
    isVideoResolution,
    isVideoContrast,
    isVideoBlendMode,
    isVideoMotion,
    TransitionOption,
    isTransitionDuration,
    isVideoOption,
    isTransitionType,
    isTransitionOverlap,
    isTransitionBorderColor,
    isTransitionBorderWidth,
    isTransitionEasing,
} from '../language-server/generated/ast.js';
import { helperTimeToSeconds } from '../lib/helper.js';

export function generatePythonProgram(videoProject: VideoProject): string {
    const fileNode = new CompositeGeneratorNode();
    compile(videoProject, fileNode)
    return toString(fileNode);
}


function compile(videoProject:VideoProject, fileNode:CompositeGeneratorNode){
    fileNode.append(
`import moviepy
`, NL);

    videoProject.elements.forEach((element) => compileElement(element, fileNode));

    videoProject.groupOptions.forEach((groupOption) => {
        compileGroupOption(groupOption, fileNode);
    });

    videoProject.timelineElements.forEach((te) => compileTimelineElement(te, fileNode));

    compileTimelineElementsOrdered(videoProject, fileNode);

    fileNode.append(
`# Export the final video
final_video.write_videofile("${videoProject.outputName}.mp4")`, NL);
}

function compileElement(element: Element, fileNode: CompositeGeneratorNode) {
    if(isVideo(element)){
        compileVideo(element, element.name, fileNode);
    } else if (isTextualElement(element)) {
        compileTextualElement(element, element, fileNode);
    }
}

function compileGroupOption(groupOption: GroupOption, fileNode: CompositeGeneratorNode) {
    groupOption.elements.forEach((elementRef) => {
        const element = elementRef.ref; 
        if (element) {
            if (isVideo(element)) {
                compileVideo(element, element.name, fileNode, groupOption.options);
            } else if (isTextualElement(element)) {
                compileTextualElement(element, element, fileNode, groupOption);
            }
        }
    });
}

function compileVideo(video: Video, name: String, fileNode: CompositeGeneratorNode, options?: Option[]) {
    if (isVideoOriginal(video)) {
        compileVideoOriginal(video, name, fileNode);
    } else if (isVideoExtract(video)) {
        compileVideoExtract(video, name, fileNode);
    }

    if (options !== undefined) {
        // check that the option is a VisualElementOption then for each option apply
        options.forEach((option) => {
            if (isVideoOption(option)) {
                compileVideoEffect(option, name, fileNode)
            }
            if (isTransitionOption(option)) {
                compileTransition(option, name, fileNode);
            }
    });
    }    
}

function compileVideoEffect(option: VisualElementOption, name: String, fileNode: CompositeGeneratorNode) {
    if (isTransitionOption(option) || isTextOption(option)) return;

    if (isVideoBrightness(option)) {
        fileNode.append(
`# Apply brightness effect
def adjust_brightness(frame, factor):
    frame = np.clip(frame * factor, 0, 255)
    return frame.astype("uint8")
from moviepy.editor import VideoFileClip
import numpy as np
${name} = ${name}.fl_image(lambda frame: adjust_brightness(frame, ${option.brightness}))`, NL);
    }

    if (isVideoScale(option)) {
        // TODO
    }

    if (isVideoResolution(option)) {
        // TODO
    }

    if (isVideoOpacity(option)) {
        // TODO
    }    
    
    if (isVideoContrast(option)) {
        // TODO
    }
    
    if (isVideoBlendMode(option)) {
        // TODO
    }

    if (isVideoMotion(option)) {
        // TODO        
    }

}

function compileTransition(option: TransitionOption, name: String, fileNode: CompositeGeneratorNode) {
    if (!isTransitionOption(option)) return;

    if (isTransitionDuration(option)) {
        fileNode.append(
`# Apply transition effect
${name} = moviepy.CompositeVideoClip([${name}.fx(moviepy.vfx.fadein, 1).fx(moviepy.vfx.fadeout, 1),
    ${option}.fx(moviepy.vfx.fadein, 1).fx(moviepy.vfx.fadeout, 1)]).set_duration(${option.duration})`, NL);
    }

    if (isTransitionType(option)) {
        // TODO
    }

    if (isTransitionOverlap(option)) {
        // TODO 
    }

    if (isTransitionBorderColor(option)) {
        // TODO
    }

    if (isTransitionBorderWidth(option)) {
        // TODO
    }

    if (isTransitionEasing(option)) {
        // TODO
    }
}

// We have visualElement and element as separate parameters because in the AST subtypes are weirdly not used
function compileVideoOriginal(videoOriginal: VideoOriginal, name: String, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the video clip original
${name} = moviepy.VideoFileClip("${videoOriginal.filePath}")
`, NL);
    fileNode.append(
    `# Resize the video clip
if ${name}.size[0]/${name}.size[1] == 16/9:
    ${name} = ${name}.resized((1920, 1080))
else:
    ${name} = ${name}.with_postition("center", "center")
    `
, NL);
}

function compileVideoExtract(videoExtract: VideoExtract, name: String, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Extract a subclip from the video
${name} = ${(videoExtract.source?.ref as Element | undefined)?.name}.subclipped(${helperTimeToSeconds(videoExtract.start)}, ${helperTimeToSeconds(videoExtract.end)})
`, NL);
    fileNode.append(
        `# Resize the video clip
if ${name}.size[0]/${name}.size[1] == 16/9:
    ${name} = ${name}.resized((1920, 1080))
else:
    ${name} = ${name}.with_postition("center", "center")
        `
    , NL);
}

function compileOptionsToTextClip(text: TextualElement, element: Element, options?: VisualElementOption[]): string {
    let bgColor = 'no';
    let bgSizeX = 1920;
    let bgSizeY = 1080;
    let font;
    const platform = navigator.userAgent || "unknown";

    if (platform.toLowerCase().includes('win')) {
        font = 'C:/Windows/Fonts/Arial.ttf';
    } else {
        font = 'Arial';
    }
    let fontSize = 60;
    let fontColor = 'white';
    let align = 'left';
    let posX: number | string = `"center"`;
    let posY: number | string = `"center"`;

    const applyOption = (option: VisualElementOption) => {
        if (isTextFont(option)) {
            if (platform.toLowerCase().includes('win')) {
                font = 'C:/Windows/Fonts/' + option.name + '.ttf';
            } else {
                font = option.name;
            }
        } else if (isTextFontSize(option)) {
            fontSize = option.size;
        } else if (isTextAligment(option)) {
            align = option.alignment;
        } else if (isTextFontColor(option)) {
            fontColor = option.color;
        } else if (isVisualElementBackground(option)) {
            bgColor = option.color;
        } else if (isVisualElementSize(option)) {
            bgSizeX = option.width;
            bgSizeY = option.height;
        } else if (isVisualElementPosition(option) && !isSubtitle(text)) {
            posX = option.x;
            posY = option.y;
        }
    };

    options?.forEach(applyOption);
    element.options?.filter((option): option is VisualElementOption => isVisualElementOption(option)).forEach(applyOption);

    if (isSubtitle(text)) {
        posY = 400;
    }

    const optionsString = `
        text="${text.text}",
        ${bgColor !== 'no' ? `bg_color="${bgColor}",` : ''}
        font="${font}",
        font_size=${fontSize},
        color="${fontColor}",
        text_align="${align}",
        size=(${bgSizeX}, ${bgSizeY}))
    `.trim().replace(/\s+/g, ' ');

    return `${optionsString}.with_position((${posX}, ${posY})`;
}

function compileTextualElement(text: TextualElement, element: Element, fileNode: CompositeGeneratorNode, groupOption?: GroupOption) {
    fileNode.append(
`# Load the text clip
${element.name} = moviepy.TextClip(${compileOptionsToTextClip(text, element, 
    groupOption?.options?.filter((option): option is VisualElementOption => isVisualElementOption(option) 
    && (isTextFont(option) || isTextFontSize(option) || isTextAligment(option) || isTextFontColor(option))))})
`, NL);
}

function compileTimelineElement(te: TimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${te.name} = `);
    if (isRelativeTimelineElement(te)) {
        compileRelativeTimelineElement(te, fileNode);
    } else if (isFixedTimelineElement(te)) {
        compileFixedTimelineElement(te, fileNode);
    } 

    // todo


}

function compileRelativeTimelineElement(rte: RelativeTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${rte.element.ref?.name}.with_start(${rte.relativeTo.ref?.name}`);
    if (isStartRelativeTimelineElement(rte)) {
        fileNode.append(`.start`);
    } else if (isEndRelativeTimelineElement(rte)) {
        fileNode.append(`.end`);
    }

    if (rte.offset) {
        const timeSeconds = helperTimeToSeconds(rte.offset.slice(1));
        const operator = rte.offset[0];
        fileNode.append(` ${operator} ${timeSeconds}`);
    }

    fileNode.append(`)`);
    if (rte.duration && (isText(rte.element.ref || isSubtitle(rte.element.ref))) ) {
        compileWithDurationElement(rte.duration, fileNode);
    } else if (isText(rte.element.ref) || isSubtitle(rte.element.ref)){
        compileWithDurationElement('00:05', fileNode);
    }

    fileNode.append(NL);
}

function compileFixedTimelineElement(fte: FixedTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${fte.element.ref?.name}.with_start(${helperTimeToSeconds(fte.startAt)})`);
    if (fte.duration && (isText(fte.element.ref) || isSubtitle(fte.element.ref))) {
        compileWithDurationElement(fte.duration, fileNode);
    } else if (isText(fte.element.ref || isSubtitle(fte.element.ref))){
        compileWithDurationElement('00:05', fileNode);
    }
    fileNode.append(NL);
}

function compileWithDurationElement(duration: string, fileNode: CompositeGeneratorNode) {
    fileNode.append(`.with_duration(${helperTimeToSeconds(duration)})`);
}

function compileTimelineElementsOrdered(videoProject: VideoProject, fileNode: CompositeGeneratorNode) {
    // Sort by layer (0 if undefined)
    const orderedTimelineElements = videoProject.timelineElements.sort((a, b) => (a.layer || 0) - (b.layer || 0));
    const timelineElementsJoined = orderedTimelineElements.map((te) => te.name).join(', ');

    fileNode.append(
`# Concatenate all clips
final_video = moviepy.CompositeVideoClip([${timelineElementsJoined}])
`, NL);
}

