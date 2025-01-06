import fs from 'fs';
import path from 'path';
import { extractDestinationAndName } from './cli-util.js';
import { generatePythonProgram } from '../generator/generator.js';
import { VideoProject } from '../language-server/generated/ast.js';

export function generatePyFile(videoProject: VideoProject, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.py`;
    
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, generatePythonProgram(videoProject));
    return generatedFilePath;
}