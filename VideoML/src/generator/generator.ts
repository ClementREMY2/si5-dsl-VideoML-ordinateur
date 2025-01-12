import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    Element,
    isVisualElement,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    VisualElement,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
} from '../language-server/generated/ast.js';
import { getLayer, helperTimeToSeconds } from '../lib/helper.js';

function formatTimelineElementName(name: string | undefined): string {
    if (!name) throw new Error('Timeline element name is missing');
    return `timeline_element_${name.slice(1)}`;
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

    // Compile explicitly declared elements (beofre timeline creation)
    videoProject.elements.forEach((element) => compileElement(element, fileNode));

    // Compile timeline elements (placement, duration)
    videoProject.timelineElements.forEach((te) => compileTimelineElement(te, fileNode, videoProject));

    // Compile the final video (concatenation)
    compileTimelineElementsOrdered(videoProject, fileNode);

    // Export the final video
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
${element.name} = ${(videoExtract.source?.ref as Element | undefined)?.name}.subclipped(${helperTimeToSeconds(videoExtract.start)}, ${helperTimeToSeconds(videoExtract.end)})
`, NL);
}

function compileTimelineElement(te: TimelineElement, fileNode: CompositeGeneratorNode, videoProject: VideoProject) {
    fileNode.append(`${formatTimelineElementName(te.name)} = `);
    if (isRelativeTimelineElement(te)) {
        compileRelativeTimelineElement(te, fileNode);
    } else if (isFixedTimelineElement(te)) {
        compileFixedTimelineElement(te, fileNode);
    } else {
        // Timeline element that is implicitly placed
        // If first in list, it's the starting point of the program
        // Else it will be placed at the end of the previous element
        if (te.$containerIndex === 0) {
            fileNode.append(`${te.element.ref?.name}`, NL);
        } else {
            const previousElement = videoProject.timelineElements[(te.$containerIndex || 1) - 1];
            fileNode.append(`${te.element.ref?.name}.with_start(${formatTimelineElementName(previousElement.name)}.end)`, NL);
        }
    }
}

function compileRelativeTimelineElement(rte: RelativeTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${rte.element.ref?.name}.with_start(${formatTimelineElementName(rte.relativeTo.ref?.name)}`);
    if (rte.place === 'start') {
        fileNode.append(`.start`);
    } else if (rte.place === 'end') {
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
    // Calculate layer for each timeline element
    const layeredTimelineElements = videoProject.timelineElements.map((te) => ({ te, layer: getLayer(te) }));

    // Sort by layer
    const orderedTimelineElements = layeredTimelineElements.sort((a, b) => a.layer - b.layer);

    const timelineElementsJoined = orderedTimelineElements.map((te) => formatTimelineElementName(te.te.name)).join(', ');
    fileNode.append(
`# Concatenate all clips
final_video = moviepy.CompositeVideoClip([${timelineElementsJoined}])
`, NL);
}
