import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    isVideoElement,
    GroupOptionVideo,
    isGroupOptionVideo,
    isTextualElement,
    GroupOptionText,
    isGroupOptionText,
    isAudioElement,
    GroupOptionAudio,
    isGroupOptionAudio,
    TimelineElement,
    isRelativeTimelineElement,
    isFixedTimelineElement,
    RelativeTimelineElement,
    FixedTimelineElement,
    isVideoExtract,
    isVideoOriginal,
} from '../language-server/generated/ast.js';
import { compileVideo, populateVideoElements } from './video-generator.js';
import { compileTextualElement, populateTextualElements } from './text-generator.js';
import { compileAudio, populateAudioElements } from './audio-generator.js';
import { helperTimeToSeconds, getLayer, getTimelineElementTextualDuration } from '../lib/helper.js';

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

    const videoElements = videoProject.elements.filter(isVideoElement);
    const groupVideoOptions: GroupOptionVideo[] = videoProject.groupOptions.filter(isGroupOptionVideo);
    const populatedVideoElements = populateVideoElements(videoElements, groupVideoOptions);
    populatedVideoElements.forEach((video) => compileVideo(video, fileNode));

    const textualElements = videoProject.elements.filter(isTextualElement);
    const groupTextOptions: GroupOptionText[] = videoProject.groupOptions.filter(isGroupOptionText);
    const populatedTextualElements = populateTextualElements(textualElements, groupTextOptions);
    populatedTextualElements.forEach((text) => compileTextualElement(text, fileNode));
    
    const audioElements = videoProject.elements.filter(isAudioElement);
    const groupAudioOptions: GroupOptionAudio[] = videoProject.groupOptions.filter(isGroupOptionAudio);
    const populatedAudioElements = populateAudioElements(audioElements, groupAudioOptions);
    populatedAudioElements.forEach((audio) => compileAudio(audio, fileNode));
    

    // Compile timeline elements (placement, duration)
    videoProject.timelineElements.forEach((te) => compileTimelineElement(te, fileNode, videoProject));

    // Compile the final video (concatenation)
    compileTimelineElementsOrdered(videoProject, fileNode);
    
    // Export the final video
    fileNode.append(
`# Export the final video
final_video.write_videofile("${videoProject.outputName}.mp4")`, NL);
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
            fileNode.append(`${te.element.ref?.name}`);
        } else {
            const previousElement = videoProject.timelineElements[(te.$containerIndex || 1) - 1];
            fileNode.append(`${te.element.ref?.name}.with_start(${formatTimelineElementName(previousElement.name)}.end)`);
        }
    }

    if (isTextualElement(te.element.ref)) {
        compileTimelineElementTextualDuration(te.duration, fileNode);
    }

    fileNode.append(NL);
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

    fileNode.append(`)`);
}

function compileFixedTimelineElement(fte: FixedTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${fte.element.ref?.name}.with_start(${helperTimeToSeconds(fte.startAt)})`);
}

function compileTimelineElementTextualDuration(duration: string | undefined, fileNode: CompositeGeneratorNode) {
    fileNode.append(`.with_duration(${helperTimeToSeconds(getTimelineElementTextualDuration(duration))})`);
}

function compileTimelineElementsOrdered(videoProject: VideoProject, fileNode: CompositeGeneratorNode) {
    // Calculate layer for each timeline element
    const layeredTimelineElements = videoProject.timelineElements.map((te) => ({ te, layer: getLayer(te) }));

    // Sort by layer
    const orderedTimelineElements = layeredTimelineElements.sort((a, b) => a.layer - b.layer);
    
    const timelineElementsVideoJoined = orderedTimelineElements
        .filter(({ te }) => isVideoExtract(te.element.ref) || isVideoOriginal(te.element.ref) || isTextualElement(te.element.ref))
        .map(({ te }) => formatTimelineElementName(te.name))
        .join(', ');
    
    const timelineElementsAudioJoined = orderedTimelineElements
        .filter(({ te }) => isAudioElement(te.element.ref) || isVideoExtract(te.element.ref) || isVideoOriginal(te.element.ref))
        .map(({ te }) => isAudioElement(te.element.ref) ? formatTimelineElementName(te.name) : `${formatTimelineElementName(te.name)}.audio`)
        .join(', ');
    

    fileNode.append(
`# Concatenate all clips
final_video = moviepy.CompositeVideoClip([${timelineElementsVideoJoined}], size=(1920, 1080))
`, NL);

    if (videoProject.timelineElements.some(te => isAudioElement(te.element.ref))) {
        fileNode.append(
`# Concatenate all audios
final_audio = moviepy.CompositeAudioClip([${timelineElementsAudioJoined}])
`, NL);
    
        fileNode.append(
`# Assign audio's concatenation to the final video
final_video.audio = final_audio
`, NL);  
    } 
}

