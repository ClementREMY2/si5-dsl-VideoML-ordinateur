import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    Element,
    Text,
    isVisualElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    isEndRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    isFontSetting,
    isFontSizeSetting,
    isAlignmentSetting,
    isPositionSetting,
    TimelineElement,
    isText,
    isFontColorSetting,
    isBackgroundColorSetting,
    isBackgroundSizeSetting,
    isSubtitle,
    Subtitle,
    VisualElement,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
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

    videoProject.timelineElements.forEach((te) => compileTimelineElement(te, fileNode));

    compileTimelineElementsOrdered(videoProject, fileNode);

    fileNode.append(
`# Export the final video
final_video.write_videofile("${videoProject.outputName}.mp4")`, NL);
}

function compileElement(element: Element, fileNode: CompositeGeneratorNode) {
    if (isVisualElement(element)) {
        compileVisualElement(element, element, fileNode);
    }
}

// We have visualElement and element as separate parameters because in the AST subtypes are weirdly not used
function compileVisualElement(visualElement: VisualElement, element: Element, fileNode: CompositeGeneratorNode) {
    if (isVideoOriginal(visualElement)) {
        compileVideoOriginal(visualElement, element, fileNode);
    }
    else if (isVideoExtract(visualElement)) {
        compileVideoExtract(visualElement, element, fileNode);
    }
    else if (isText(visualElement)) {
        compileText(visualElement, element, fileNode);
    }
    else if(isSubtitle(visualElement)){
        compileSubtitle(visualElement, element, fileNode);
    }
}

// We have visualElement and element as separate parameters because in the AST subtypes are weirdly not used
function compileVideoOriginal(videoOriginal: VideoOriginal, element: Element, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the video clip original
${element.name} = moviepy.VideoFileClip("${videoOriginal.filePath}")
`, NL);
}

function compileVideoExtract(videoExtract: VideoExtract, element: Element, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Extract a subclip from the video
${element.name} = ${(videoExtract.source?.ref as Element | undefined)?.name}.subclipped(${helperTimeToSeconds(videoExtract.start)}, ${helperTimeToSeconds(videoExtract.end)})
`, NL);
    fileNode.append(
        `# Resize the video clip
if ${element.name}.size[0]/${element.name}.size[1] == 16/9:
    ${element.name} = ${element.name}.resized((1920, 1080))
else:
    ${element.name} = ${element.name}.with_postition("center", "center")
        `
    , NL);
}

function compileText(text: Text, element: Element, fileNode: CompositeGeneratorNode) {
    let bgColor = 'no';
    let bgSizeX = -1;
    let bgSizeY = -1;
    let font = 'Arial';
    let fontSize = 12;
    let fontColor = 'white';
    let align = 'left';
    let posX = -1;
    let posY = -1;

    for (const setting of text.settings) {
        if (isBackgroundColorSetting(setting)) {
            bgColor = setting.color;
        } else if (isBackgroundSizeSetting(setting)){
            bgSizeX = setting.x;
            bgSizeY = setting.y;
        }else if (isFontSetting(setting)) {
            font = setting.name;
        } else if (isFontSizeSetting(setting)) {
            fontSize = setting.size;
        } else if (isAlignmentSetting(setting)) {
            align = setting.value;
        } else if (isPositionSetting(setting)) {
            posX = setting.x;
            posY = setting.y;
        } else if (isFontColorSetting(setting)) {
            fontColor = setting.color;
        }
    }

    fileNode.append(
`# Load the text clip
${element.name} = moviepy.TextClip(text="${text.text}", ${bgColor === 'no' ? '' : `bg_color="${bgColor}", `}font="${font}", font_size=${fontSize}, color="${fontColor}", text_align="${align}", size=(${bgSizeX === -1 ? 1920 : bgSizeX}, ${bgSizeY === -1 ? 1080 : bgSizeY})).with_position((${posX === -1 ? `"center"` : posX}, ${posY === -1 ? `"center"` : posY}))
`, NL);
}

function compileSubtitle(subtitle: Subtitle, element: Element, fileNode: CompositeGeneratorNode) {
    let bgColor = 'no';
    let font = 'Arial';
    let fontSize = 50;
    let fontColor = 'white';
    let align = 'left';
    let posX = -1;
    let posY = 900;

    for (const setting of subtitle.settings) {
        if (isBackgroundColorSetting(setting)) {
            bgColor = setting.color;
        } else if (isFontSetting(setting)) {
            font = setting.name;
        } else if (isFontSizeSetting(setting)) {
            fontSize = setting.size;
        } else if (isAlignmentSetting(setting)) {
            align = setting.value;
        } else if (isPositionSetting(setting)) {
            posX = setting.x;
            posY = setting.y;
        } else if (isFontColorSetting(setting)) {
            fontColor = setting.color;
        }
    }

    fileNode.append(
`# Load the subtitle clip
${element.name} = moviepy.TextClip(text="${subtitle.text}", ${bgColor === 'no' ? '' : `bg_color="${bgColor}", `}font="${font}.ttf", font_size=${fontSize}, color="${fontColor}", text_align="${align}", method="label").with_position((${posX === -1 ? `"center"` : posX}, ${posY === -1 ? `"center"` : posY}))
`, NL);
    }

function compileTimelineElement(te: TimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${te.name} = `);
    if (isRelativeTimelineElement(te)) {
        compileRelativeTimelineElement(te, fileNode);
    } else if (isFixedTimelineElement(te)) {
        compileFixedTimelineElement(te, fileNode);
    } 
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
