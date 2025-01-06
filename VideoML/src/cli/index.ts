import chalk from 'chalk';
import { Command } from 'commander';
import { VideoProject } from '../language-server/generated/ast.js';
import { VideoMlLanguageMetaData } from '../language-server/generated/module.js';
import { createVideoMlServices } from '../language-server/video-ml-module.js';
import { extractAstNode } from './cli-util.js';
import { generatePyFile } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { readFile } from 'fs/promises';

const packageJson = JSON.parse(
  (await readFile(new URL('../../package.json', import.meta.url))).toString()
);

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createVideoMlServices(NodeFileSystem).VideoMl;
    const videoProject = await extractAstNode<VideoProject>(fileName, services);
    const generatedFilePath = generatePyFile(videoProject, fileName, opts.destination);
    console.log(chalk.green(`Video code generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program
        .version(packageJson.version);

    const fileExtensions = VideoMlLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program.parse(process.argv);
}
