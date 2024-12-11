import chalk from 'chalk';
import { Command } from 'commander';
import { VideoProject } from '../language-server/generated/ast';
import { VideoMlLanguageMetaData } from '../language-server/generated/module';
import { createVideoMlServices } from '../language-server/video-ml-module';
import { extractAstNode } from './cli-util';
import { generatePyFile } from './generator';
import { NodeFileSystem } from 'langium/node';

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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = VideoMlLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program.parse(process.argv);
}
