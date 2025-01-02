import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const monarchFilePath = path.join(__dirname, '../syntaxes/video-ml.monarch.ts');
const videoMlFilePath = path.join(__dirname, '../web-ui/src/lib/video-ml.ts');

const monarchContent = fs.readFileSync(monarchFilePath, 'utf-8');
const monarchExport = monarchContent.match(/export\s+default\s+({[\s\S]*?});/);

if (monarchExport) {
    const monarchGrammar = monarchExport[1];
    const getMonarchGrammarFunction = `// GENERATED CODE - START
/**
 * Returns a Monarch grammar definition for MiniLogo
 */
export function getMonarchGrammar() {
    return ${monarchGrammar};
}
// GENERATED CODE - END`;

    let videoMlContent = fs.readFileSync(videoMlFilePath, 'utf-8');
    videoMlContent = videoMlContent.replace(/\/\/ GENERATED CODE - START[\s\S]*?\/\/ GENERATED CODE - END/, getMonarchGrammarFunction);

    fs.writeFileSync(videoMlFilePath, videoMlContent, 'utf-8');
    console.log('getMonarchGrammar function updated successfully.');
} else {
    console.error('Failed to find the default export in video-ml.monarch.ts');
}