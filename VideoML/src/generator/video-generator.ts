import { CompositeGeneratorNode, NL } from "langium/generate";
import { GroupOptionVideo, isVideoBrightness, isVideoContrast, isVideoExtract, isVideoOpacity, isVideoOriginal, isVideoRotation, isVideoSaturation, isVideoScale, isVideoTransition, isVisualElementOption, isVisualElementPosition, isVisualElementSize, VideoElement, VideoExtract, VideoOption, VideoOriginal, VisualElementOption } from "../language-server/generated/ast.js";
import { helperTimeToSeconds } from "../lib/helper.js";

export function populateVideoElements(videoElements: VideoElement[], groupVideoOptions: GroupOptionVideo[]): VideoElement[] {
    return videoElements.map((video) => {
        const relatedGroupOptions = groupVideoOptions.filter((groupOption) => groupOption.elements.some((element) => element.ref?.name === video.name));

        // This list can have duplicates
        const mergedOptions = [
            ...(video.videoOption || []), // Video options
            ...relatedGroupOptions.map((groupOption) => groupOption.options).flat(), // Group options
        ];

        // This map filters the duplicates (video option applied when declaring the video are prioritized)
        const uniqueOptionMap = mergedOptions.reduce((acc, option) => {
            // Check if the option is already in the list
            if (acc.has(option.$type)) {
                return acc;
            }

            if(isVideoTransition(option)){
                if(acc.has(option.type)){
                    return acc;
                }
                acc.set(option.type, option);
            } else{
                // Add the option to the list
                acc.set(option.$type, option);
            }

            return acc;
        }, new Map<string, VideoOption>());

        // Map to array and sort for some special cases
        video.videoOption = Array.from(uniqueOptionMap.values()).sort((a, b) => {
            const order = ['VideoResolution', 'VisualElementSize', 'VisualElementPosition'];
            return order.indexOf(a.$type) - order.indexOf(b.$type);
        });

        return video;
    });
}


export function compileVideo(video: VideoElement, fileNode: CompositeGeneratorNode) {
    if (isVideoOriginal(video)) {
        compileVideoOriginal(video, fileNode);
    } else if (isVideoExtract(video)) {
        compileVideoExtract(video, fileNode);
    }
    // Add the video options
    video.videoOption?.forEach((option) => {
        compileVideoOption(option, video, fileNode);
    });
}

function compileVideoOriginal(video: VideoOriginal, fileNode: CompositeGeneratorNode) {
    fileNode.append(
        `# Load the video clip original
${video.name} = moviepy.VideoFileClip("${video.filePath}")
`, NL);
fileNode.append(
    `# Resize the video clip
if ${video.name}.size[0] / ${video.name}.size[1] == 16/9:
    ${video.name} = ${video.name}.resized((1920, 1080))
else:
    if ${video.name}.size[0] / ${video.name}.size[1] > 1:
        ${video.name} = ${video.name}.resized(width=1920)
    else:
        ${video.name} = ${video.name}.resized(height=1080)
    ${video.name} = ${video.name}.with_position("center", "center")
    `
    , NL);
}

function compileVideoExtract(video: VideoExtract, fileNode: CompositeGeneratorNode) {
    fileNode.append(
        `# Extract a subclip from the video
${video.name} = ${(video.source?.ref as VideoOriginal)?.name}.subclipped(${helperTimeToSeconds(video.start)}, ${helperTimeToSeconds(video.end)})
`, NL);
    fileNode.append(
        `# Resize the video clip
if ${video.name}.size[0]/${video.name}.size[1] == 16/9:
    ${video.name} = ${video.name}.resized((1920, 1080))
else:
    ${video.name} = ${video.name}.with_position("center", "center")
`, NL);
}

function compileVideoOption(option: VideoOption, video: VideoElement, fileNode: CompositeGeneratorNode) {
    const videoName = video.name;
    if (isVideoBrightness(option)) {
        fileNode.append(
            `# Apply brightness effect
multiply_effect = moviepy.video.fx.MultiplyColor(factor=${option.brightness})
${videoName} = multiply_effect.apply(${videoName})`, NL);
    }

    if (isVideoScale(option)) {
        const new_value = option.scale;
        fileNode.append(
            `# Apply resolution effect
resize_effect = moviepy.video.fx.Resize(${new_value})
${videoName} = resize_effect.apply(${videoName})`, NL);
    }

    if (isVideoOpacity(option)) {
        fileNode.append(
            `# Apply opacity effect
${videoName} = ${videoName}.with_opacity(${option.opacity})`, NL);
    }

    if (isVideoContrast(option)) {
        fileNode.append(
            // Use the colorx effect to adjust the contrast
            `# Apply contrast effect
lum_contrast_effect = moviepy.video.fx.LumContrast(lum=20, contrast=${option.contrast}, contrast_threshold=127)
${videoName} = lum_contrast_effect.apply(${videoName})`, NL);
    }

    if (isVideoSaturation(option)) {
        fileNode.append(
            `# Apply saturation effect
painting_effect = moviepy.video.fx.Painting(saturation=${option.saturation}, black=0.0)
${videoName} = painting_effect.apply(${videoName})`, NL);
    }

    if (isVideoRotation(option)) {
        fileNode.append(
            `# Apply rotation effect
rotate_effect = moviepy.video.fx.Rotate(angle=${option.rotation}, unit="deg", resample="bicubic", expand=True)
${videoName} = rotate_effect.apply(${videoName})`, NL);
    }

    if (isVideoTransition(option)) {
        if (option.type === 'fadein') {
            fileNode.append(
                `# Apply fade in effect
fade_in = moviepy.video.fx.CrossFadeIn(1)
${videoName} = fade_in.apply(${videoName})`, NL);
        }
        else if (option.type === 'fadeout') {
            fileNode.append(
                `# Apply fade out effect
fade_out = moviepy.video.fx.CrossFadeOut(1)
${videoName} = fade_out.apply(${videoName})`, NL);
        }
    }

    if (isVisualElementOption(option)) {
        compileVisualElementOption(option, video, fileNode);
    }

}

function compileVisualElementOption(option: VisualElementOption, video: VideoElement, fileNode: CompositeGeneratorNode) {
    if (isVisualElementPosition(option)) {
        let x: String | Number = 0;
        let y: String | Number = 0;
        if (option.x)
            x = option.x;
        if (option.y)
            y = option.y;
        if (option.alignmentx === 'center')
            x = `'center'`;
        if (option.alignmenty === 'center')
            y = `'center'`;
        if (option.alignmentx === 'right'){
            x = 1920 - (getResolution(video.videoOption.find(isVisualElementSize)?.resolution||'')?.width || video.videoOption.find(isVisualElementSize)?.width || 0);
        }
        if (option.alignmentx === 'left')
            x = 0;
        if (option.alignmenty === 'bottom')
            y = 1080 - (getResolution(video.videoOption.find(isVisualElementSize)?.resolution||'')?.height || video.videoOption.find(isVisualElementSize)?.height || 0);
        if (option.alignmenty === 'top')
            y = 0;
        fileNode.append(
            `# Apply position effect
${video.name} = ${video.name}.with_position((${x},${y}))`, NL);
    }
    if (isVisualElementSize(option)) {
        if(option.width && option.height){
        fileNode.append(
            `# Apply size effect
${video.name} = ${video.name}.resized((${option.width},${option.height}))`, NL);
        }
        if(option.resolution){
            const resolution = getResolution(option.resolution);
            fileNode.append(
                `# Apply resolution effect
${video.name} = ${video.name}.resized((${resolution?.width},${resolution?.height}))`, NL);
        }
    }
}

function getResolution(name: string) {
    const resolutions = [
        {
            name: 'webcam',
            width: 640,
            height: 480
        }
    ]
    return resolutions.find(resolution => resolution.name === name);
}