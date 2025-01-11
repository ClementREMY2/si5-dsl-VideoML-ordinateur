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
    Video,
    isVideo,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
    Audio,
    isAudio,
    AudioOriginal,
    isAudioOriginal,
    AudioExtract,
    isAudioExtract,
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
    if (isVideo(element)) {
        compileVideo(element, element, fileNode);
    }
    else if (isAudio(element)) {
        compileAudio(element, element, fileNode);
    }
}

function compileAudio(audio: Audio, element: Element, fileNode: CompositeGeneratorNode) {
    if (isAudioOriginal(audio)) {
        compileAudioOriginal(audio, element, fileNode);
    }
    else if (isAudioExtract(audio)) {
        compileAudioExtract(audio, element, fileNode);
    }
}

function compileAudioOriginal(audioOriginal: AudioOriginal, element: Element, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the audio clip
${element.name} = moviepy.AudioFileClip("${audioOriginal.filePath}")
`, NL);
}

function compileAudioExtract(audioExtract: AudioExtract, element: Element, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Extract a subclip from the audio
${element.name} = ${(audioExtract.source?.ref as Element | undefined)?.name}.subclipped(${helperTimeToSeconds(audioExtract.start)}, ${helperTimeToSeconds(audioExtract.end)})
`, NL);
}

// We have video and element as separate parameters because in the AST subtypes are weirdly not used
function compileVideo(video: Video, element: Element, fileNode: CompositeGeneratorNode) {
    if (isVideoOriginal(video)) {
        compileVideoOriginal(video, element, fileNode);
    }
    else if (isVideoExtract(video)) {
        compileVideoExtract(video, element, fileNode);
    }
}

// We have videoOriginal and element as separate parameters because in the AST subtypes are weirdly not used
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
    
    const timelineElementsVideoJoined = orderedTimelineElements
        .filter(te => isVideoExtract(te.element.ref) || isVideoOriginal(te.element.ref))
        .map(te => te.name)
        .join(', ');
    
        const timelineElementsAudioJoined = orderedTimelineElements
            .filter(te => isAudio(te.element.ref) || isVideoExtract(te.element.ref) || isVideoOriginal(te.element.ref))
            .map(te => isAudio(te.element.ref) ? te.name : `${te.name}.audio`)
            .join(', ');
    

    fileNode.append(
`# Concatenate all clips
final_video = moviepy.CompositeVideoClip([${timelineElementsVideoJoined}])
`, NL);

    if (videoProject.timelineElements.some(te => isAudio(te.element.ref))) {
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
