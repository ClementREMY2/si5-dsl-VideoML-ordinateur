import { CompositeGeneratorNode, NL } from "langium/generate";
import { AudioElement, GroupOptionAudio, AudioOption, isAudioExtract, isAudioOption, isAudioOriginal, AudioOriginal, AudioExtract, isAudioFadeIn, isAudioFadeOut, isAudioStereoVolume, isAudioVolume } from "../language-server/generated/ast.js";
import { helperTimeToSeconds } from "../lib/helper.js";

export function populateAudioElements(audioElements: AudioElement[], groupAudioOptions: GroupOptionAudio[]): AudioElement[] {
    return audioElements.map((audio) => {
        const relatedGroupOptions = groupAudioOptions.filter((groupOption) => groupOption.elements.some((element) => element.ref?.name === audio.name));

        // This list can have duplicates
        const mergedOptions = [
            ...(audio.audioOptions || []), // Video options
            ...relatedGroupOptions.map((groupOption) => groupOption.options).flat(), // Group options
        ];

        // This map filters the duplicates (video option applied when declaring the video are prioritized)
        const uniqueOptionMap = mergedOptions.reduce((acc, option) => {
            // Check if the option is already in the list
            if (acc.has(option.$type)) {
                return acc;
            }

            // Add the option to the list
            acc.set(option.$type, option);
            return acc;
        }, new Map<string, AudioOption>());

        // Map to array and sort for some special cases
        audio.audioOptions = Array.from(uniqueOptionMap.values()).sort((a, b) => {
            const order = ['AudioVolume', 'AudioFadeIn', 'AudioFadeOut', 'AudioStereoVolume'];
            return order.indexOf(a.$type) - order.indexOf(b.$type);
        });

        return audio;
    });
}

export function compileAudio(audio: AudioElement, fileNode: CompositeGeneratorNode) {
    if (isAudioOriginal(audio)) {
        compileAudioOriginal(audio, fileNode);
    }
    else if (isAudioExtract(audio)) {
        compileAudioExtract(audio, fileNode);
    }
    audio.audioOptions.forEach((option) => {
        if (isAudioOption(option)) {
            compileAudioEffect(option, audio.name, fileNode)
        }
    });
} 

function compileAudioOriginal(audioOriginal: AudioOriginal, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the audio clip
${audioOriginal.name} = moviepy.AudioFileClip("${audioOriginal.filePath}")
`, NL);
}

function compileAudioExtract(audioExtract: AudioExtract, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Extract a subclip from the audio
${audioExtract.name} = ${(audioExtract.source?.ref as AudioElement).name}.subclipped(${helperTimeToSeconds(audioExtract.start)}, ${helperTimeToSeconds(audioExtract.end)})
`, NL);
}

function compileAudioEffect(option: AudioOption, name: String, fileNode: CompositeGeneratorNode) {
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