import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    Element,
    isVisualElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    isEndRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    VisualElement,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
} from '../language-server/generated/ast.js';

function helperTimeToSeconds(time: string): number {
    const timeArray = time.split(':');
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
}

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
${element.name} = ${videoExtract.source?.ref?.name}.subclipped(${helperTimeToSeconds(videoExtract.start)}, ${helperTimeToSeconds(videoExtract.end)})
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

    fileNode.append(`)
`, NL);
}

function compileFixedTimelineElement(fte: FixedTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${fte.element.ref?.name}.with_start(${helperTimeToSeconds(fte.startAt)})`, NL);
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
