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
    if(isVideo(element)){
        compileVideo(element, element.name, fileNode);
    } else if (isTextualElement(element)) {
        compileTextualElement(element, element, fileNode);
    }
}

function compileVideo(video: Video, name: String, fileNode: CompositeGeneratorNode) {
    if (isVideoOriginal(video)) {
        compileVideoOriginal(video, name, fileNode);
    } else if (isVideoExtract(video)) {
        compileVideoExtract(video, name, fileNode);
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

function compileTextualElement(text: TextualElement, element: Element, fileNode: CompositeGeneratorNode) {
    //TODO : adapt default values according to the type of the text
    let bgColor = 'no';
    let bgSizeX = -1;
    let bgSizeY = -1;
    let font = 'Arial';
    let fontSize = 60;
    let fontColor = 'white';
    let align = 'left';
    let posX = -1;
    let posY = -1;

    if (element.options) {
        for (const option of element.options) {
            if (isTextFont(option)) {
                font = option.name;
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
        }
    }

    fileNode.append(
`# Load the text clip
${element.name} = moviepy.TextClip(text="${text.text}", ${bgColor === 'no' ? '' : `bg_color="${bgColor}", `}font="${font}", font_size=${fontSize}, color="${fontColor}", text_align="${align}", size=(${bgSizeX === -1 ? 1920 : bgSizeX}, ${bgSizeY === -1 ? 1080 : bgSizeY})).with_position((${posX === -1 ? `"center"` : posX}, ${posY === -1 ? isSubtitle(text) ? 400 : `"center"` : posY}))
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

