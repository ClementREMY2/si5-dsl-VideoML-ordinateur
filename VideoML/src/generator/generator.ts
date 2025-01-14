import { CompositeGeneratorNode, NL, toString } from 'langium/generate';
import {
    VideoProject,
    Element,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    isVideoElement,
    VideoElement,
    VideoOriginal,
    isVideoOriginal,
    VideoExtract,
    isVideoExtract,
    AudioElement,
    isAudioElement,
    AudioOriginal,
    isAudioOriginal,
    AudioExtract,
    isAudioExtract,
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
    TextOption,
    GroupOptionText,
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

    videoProject.groupOptions.forEach((groupOption) => {
        compileGroupOption(groupOption, fileNode);
    });

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
    if(isVideoElement(element)){
        compileVideo(element, element.name, fileNode);
    } else if (isTextualElement(element)) {
        compileTextualElement(element, element, fileNode);
    }
    else if (isAudioElement(element)) {
        compileAudio(element, element.name, fileNode);
    }
}

function compileAudio(audio: AudioElement, name: string, fileNode: CompositeGeneratorNode) {
    if (isAudioOriginal(audio)) {
        compileAudioOriginal(audio, name, fileNode);
    }
    else if (isAudioExtract(audio)) {
        compileAudioExtract(audio, name, fileNode);
    }
}

function compileAudioOriginal(audioOriginal: AudioOriginal, name: string, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the audio clip
${name} = moviepy.AudioFileClip("${audioOriginal.filePath}")
`, NL);
}

function compileAudioExtract(audioExtract: AudioExtract, name: string, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Extract a subclip from the audio
${name} = ${(audioExtract.source?.ref as Element | undefined)?.name}.subclipped(${helperTimeToSeconds(audioExtract.start)}, ${helperTimeToSeconds(audioExtract.end)})
`, NL);
}

function compileGroupOption(groupOption: GroupOption, fileNode: CompositeGeneratorNode) {
    groupOption.elements.forEach((elementRef) => {
        const element = elementRef.ref; 
        if (element) {
            if (isVideoElement(element)) {
                compileVideo(element, element.name, fileNode);
            } else if (isTextualElement(element)) {
                compileTextualElement(element, element, fileNode, groupOption as GroupOptionText);
            }
        }
    });
}

function compileVideo(video: VideoElement, name: String, fileNode: CompositeGeneratorNode) {
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
    ${name} = ${name}.with_position("center", "center")
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
    ${name} = ${name}.with_position("center", "center")
        `
    , NL);
}

function compileOptionsToTextClip(text: TextualElement, options?: TextOption[]): string {
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

    const applyOption = (option: TextOption) => {
        if (isTextFont(option)) {
            if (platform.toLowerCase().includes('win')) {
                font = 'C:/Windows/Fonts/' + option.name + '.ttf';
            } else {
                font = option.name;
            }        
        } 
        else if (isTextFontSize(option)) {
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
        } else if (isVisualElementPosition(option) && text.type === 'subtitle') {
            posX = option.x;
            posY = option.y;
        }
    };

    options?.forEach(applyOption);
    text.options?.forEach(applyOption);

    if (text.type === 'subtitle') {
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

function compileTextualElement(text: TextualElement, element: Element, fileNode: CompositeGeneratorNode, groupOption?: GroupOptionText) {
    fileNode.append(
`# Load the text clip
${element.name} = moviepy.TextClip(${compileOptionsToTextClip(text, groupOption?.options)})
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
            fileNode.append(`${te.element.ref?.name}`);
        } else {
            const previousElement = videoProject.timelineElements[(te.$containerIndex || 1) - 1];
            fileNode.append(`${te.element.ref?.name}.with_start(${formatTimelineElementName(previousElement.name)}.end)`);
        }
        if (isTextualElement(te.element.ref)) {
            if(te.duration){
                compileWithDurationElement(te.duration, fileNode);
            }
            else {
                compileWithDurationElement('00:05', fileNode);
            }
        }
        fileNode.append(NL);
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

    fileNode.append(`)`);
    if (rte.duration && (isTextualElement(rte.element.ref)) ) {
        compileWithDurationElement(rte.duration, fileNode);
    } else if (isTextualElement(rte.element.ref)){
        compileWithDurationElement('00:05', fileNode);
    }

    fileNode.append(NL);
}

function compileFixedTimelineElement(fte: FixedTimelineElement, fileNode: CompositeGeneratorNode) {
    fileNode.append(`${fte.element.ref?.name}.with_start(${helperTimeToSeconds(fte.startAt)})`);
    if (fte.duration && isTextualElement(fte.element.ref)) {
        compileWithDurationElement(fte.duration, fileNode);
    } else if (isTextualElement(fte.element.ref)){
        compileWithDurationElement('00:05', fileNode);
    }
    fileNode.append(NL);
}

function compileWithDurationElement(duration: string, fileNode: CompositeGeneratorNode) {
    fileNode.append(`.with_duration(${helperTimeToSeconds(duration)})`);
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
final_video = moviepy.CompositeVideoClip([${timelineElementsVideoJoined}])
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

