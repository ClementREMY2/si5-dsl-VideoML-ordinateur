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
    GroupOptionVideo,
    VideoOption,
    isVideoOption,
    isVideoBrightness,
    isVideoScale,
    isVideoResolution,
    isVideoOpacity,
    isVideoContrast,
    isVideoPainting,
    isTextOption,
    isVisualElementOption,
    isVideoSaturation,
    isVideoRotation,
    GroupOptionAudio,
    isAudioOption,
    AudioOption,
    isAudioVolume,
    isAudioFadeIn,
    isAudioFadeOut,
    isAudioStereoVolume,
    isVideoTransition,
} from '../language-server/generated/ast.js';
import { getLayer, helperTimeToSeconds } from '../lib/helper.js';

const textClips = new Set<string>();


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

function compileAudio(audio: AudioElement, name: string, fileNode: CompositeGeneratorNode, groupOption?: GroupOptionAudio) {
    if (!groupOption) { //user wants to load the audio
        if (isAudioOriginal(audio)) {
            compileAudioOriginal(audio, name, fileNode);
        }
        else if (isAudioExtract(audio)) {
            compileAudioExtract(audio, name, fileNode);
        }
    }
    else { //user wants to apply effects to the audio
    const options = groupOption?.options;
    if (options !== undefined) {
        options.forEach((option) => {
            if (isAudioOption(option)) {
                compileAudioEffect(option, name, fileNode)
            }
    });
    } 
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
                compileVideo(element, element.name, fileNode, groupOption as GroupOptionVideo);
            } else if (isTextualElement(element)) {
                compileTextualElement(element, element, fileNode, groupOption as GroupOptionText);
            }
            else if (isAudioElement(element)) {
                compileAudio(element, element.name, fileNode, groupOption as GroupOptionAudio);
            }
        }
    });
}

function compileVideo(video: VideoElement, name: String, fileNode: CompositeGeneratorNode, groupOption?: GroupOptionVideo) {
    if (!groupOption) { //user wants to load the video
        if (isVideoOriginal(video)) {
            compileVideoOriginal(video, name, fileNode);
        } else if (isVideoExtract(video)) {
            compileVideoExtract(video, name, fileNode);
        }
    }
    else { //user wants to apply effects to the video

    const options = groupOption?.options;
    if (options !== undefined) {
        options.forEach((option) => {
            if (isVideoOption(option)) {
                compileVideoEffect(option, name, fileNode)
            }
    });
    } 
}   
}

function compileVideoEffect(option: VideoOption, name: String, fileNode: CompositeGeneratorNode) {
    if (isTextOption(option) || isVisualElementOption(option)) return;

    if (isVideoBrightness(option)) {
        fileNode.append(
            `# Apply brightness effect
multiply_effect = moviepy.video.fx.MultiplyColor(factor=${option.brightness})
${name} = multiply_effect.apply(${name})`, NL);
    }

    if (isVideoScale(option)) {
        const new_value = option.scale / 100;
        fileNode.append(
`# Apply resolution effect
resize_effect = moviepy.video.fx.Resize(new_size=${new_value})
${name} = resize_effect.apply(${name})`, NL); 
}

    if (isVideoResolution(option)) {
        fileNode.append(
`# Apply resolution effect
resize_effect = moviepy.video.fx.Resize(new_size=(${option.width}, ${option.height}))
${name} = resize_effect.apply(${name})`, NL);
    }

    if (isVideoOpacity(option)) {
        fileNode.append(
            `# Apply opacity effect
${name} = ${name}.with_opacity(${option.opacity})`, NL);
    }    

    if (isVideoContrast(option)) {
        fileNode.append(
// Use the colorx effect to adjust the contrast
`# Apply contrast effect
lum_contrast_effect = moviepy.video.fx.LumContrast(lum=20, contrast=${option.contrast}, contrast_threshold=127)
${name} = lum_contrast_effect.apply(${name})`, NL);
    }

    if (isVideoSaturation(option)) {
        fileNode.append(
`# Apply saturation effect
painting_effect = moviepy.video.fx.Painting(saturation=${option.saturation}, black=0.0)
${name} = painting_effect.apply(${name})`, NL);
    }

    if (isVideoPainting(option)) {
        const calculatedOption = option.painting / 1000;
        fileNode.append(
`# Apply saturation effect
painting_effect = moviepy.video.fx.Painting(saturation=0, black=${calculatedOption})
${name} = painting_effect.apply(${name})`, NL);  
    }

    if (isVideoRotation(option)) {
        fileNode.append(
`# Apply rotation effect
rotate_effect = moviepy.video.fx.Rotate(angle=${option.rotation}, unit="deg", resample="bicubic", expand=True)
${name} = rotate_effect.apply(${name})`, NL);  
    }

    if (isVideoTransition(option)) {
        if (option.type === 'fadein') {
            fileNode.append(
                `# Apply fade in effect
fade_in = moviepy.video.fx.CrossFadeIn(1)
${name} = fade_in.apply(${name})`, NL);
        }
        else if (option.type === 'fadeout') {
            fileNode.append(
                `# Apply fade out effect
fade_out = moviepy.video.fx.CrossFadeOut(1)
${name} = fade_out.apply(${name})`, NL);
        }
    }
}


function compileAudioEffect(option: AudioOption, name: String, fileNode: CompositeGeneratorNode) {
    if (isTextOption(option) || isVisualElementOption(option)) return;

    if (isAudioVolume(option)) {
        fileNode.append(
            `# Apply brightness effect
new_volume = moviepy.audio.fx.MultiplyStereoVolume(left=${option.volume}, right=${option.volume})
${name} = new_volume.apply(${name})`, NL);
    }

    if (isAudioFadeIn(option)) {
        fileNode.append(
            `# Apply fade in effect
fade_in = moviepy.audio.fx.AudioFadeIn(${option.duration})
${name} = fade_in.apply(${name})`, NL);
    }

    if (isAudioFadeOut(option)) {
        fileNode.append(
            `# Apply fade out effect
fade_out = moviepy.audio.fx.AudioFadeOut(${option.duration})
${name} = fade_out.apply(${name})`, NL);
    }

    if (typeof option === 'string' && option === 'normalize') {
        fileNode.append(
            `# Apply normalize effect
normalize_effect = moviepy.audio.fx.moviepy.audio.fx.AudioNormalize()
${name} = normalize_effect.apply(${name})`, NL);
    }

    if (isAudioStereoVolume(option)) { 
        fileNode.append(
            `# Apply stereo volume effect
stereo_volume = moviepy.audio.fx.MultiplyStereoVolume(left=${option.left}, right=${option.right})
${name} = stereo_volume.apply(${name})`, NL);
    }
}

// We have visualElement and element as separate parameters because in the AST subtypes are weirdly not used
function compileVideoOriginal(videoOriginal: VideoOriginal, name: String, fileNode: CompositeGeneratorNode, options?: VideoOption[]) {
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

function compileVideoExtract(videoExtract: VideoExtract, name: String, fileNode: CompositeGeneratorNode, options?: VideoOption[]) {
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

    let font = fontDependingOnOS();
    
    let fontSize = 60;
    let fontColor = 'white';
    let align = 'left';
    let posX: number | string = `"center"`;
    let posY: number | string = `"center"`;

    const applyOption = (option: TextOption) => {
        if (isTextFont(option)) {
            font = fontDependingOnOS(font); 
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

function fontDependingOnOS(font?: string) {
    const platform = navigator.userAgent || "unknown";
    if (platform.toLowerCase().includes('win')) {
        if (font) {
            return `C:/Windows/Fonts/${font}.ttf`;
        } 
        return 'C:/Windows/Fonts/Arial.ttf';
    } 
    else {
        if (font) {
            return `${font}`;
        }
        return 'Arial';
    }
}

function compileTextualElement(text: TextualElement, element: Element, fileNode: CompositeGeneratorNode, groupOption?: GroupOptionText) {
    if (!textClips.has(element.name)) {
        textClips.add(element.name);
        fileNode.append(
            `# Load the text clip
            ${element.name} = moviepy.TextClip(${compileOptionsToTextClip(text, groupOption?.options)})
            `, NL);
    }
    else {
        fileNode.append(
            `# Reload the text clip, to apply new effects
            ${element.name} = moviepy.TextClip(${compileOptionsToTextClip(text, groupOption?.options)})
            `, NL);
    }
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

