import fs from 'fs';
import { CompositeGeneratorNode, NL, toString } from 'langium';
import path from 'path';
import {
	VideoProject,
    Element,
    isMedia,
    isVideo,
    Media,
    Video,
} from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

export function generatePyFile(videoProject: VideoProject, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.py`;

    const fileNode = new CompositeGeneratorNode();
    compile(videoProject, fileNode)
    
    
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}


function compile(videoProject:VideoProject, fileNode:CompositeGeneratorNode){
    fileNode.append(
`import moviepy
`, NL);

    videoProject.elements.forEach((element) => compileElement(element, fileNode));

    fileNode.append(
`# Export the final video
final_video.write_videofile("${videoProject.outputName}.mp4")`, NL);
}

function compileElement(element: Element, fileNode: CompositeGeneratorNode) {
    if (isMedia(element)) {
        compileMedia(element, fileNode);
    }
}

function compileMedia(media: Media, fileNode: CompositeGeneratorNode) {
    if (isVideo(media)) {
        compileVideo(media, fileNode);
    }
}

function compileVideo(video: Video, fileNode: CompositeGeneratorNode) {
    fileNode.append(
`# Load the video clip
video_${video.name} = moviepy.VideoFileClip("${video.path}")
`, NL);
}