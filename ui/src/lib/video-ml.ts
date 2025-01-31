/* eslint-disable no-useless-escape */
import { UserConfig } from "monaco-editor-wrapper/bundle";

export type WorkerUrl = string;

/**
 * Generalized configuration used with 'getMonacoEditorReactConfig' to generate a working configuration for monaco-editor-react
 */
export interface ClassicConfig {
    code: string,
    languageId: string,
    worker: WorkerUrl | Worker,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monarchGrammar: any;
}

/**
 * Generates a UserConfig for a given Langium example, which is then passed to the monaco-editor-react component
 * 
 * @param config A VSCode API or classic editor config to generate a UserConfig from
 * @returns A completed UserConfig
 */
export function createUserConfig(config: ClassicConfig): UserConfig {
    // setup urls for config & grammar
    const id = config.languageId;

    // generate langium config
    return {
        wrapperConfig: {
            editorAppConfig: {
                $type: 'classic',
                languageId: id,
                useDiffEditor: false,
                code: config.code,
                theme: 'vs-dark',
                languageDef: config.monarchGrammar,
                editorOptions: {
                    minimap: {
                        enabled: false,
                    },
                },
            },
            serviceConfig: {
                debugLogging: false
            }
        },
        languageClientConfig: {
            options: {
                $type: 'WorkerDirect',
                worker: config.worker as Worker,
                name: `${id}-language-server-worker`
            }
        }
    };
}

// GENERATED CODE - START
/**
 * Returns a Monarch grammar definition for MiniLogo
 */
export function getMonarchGrammar() {
    return {
    keywords: [
        'apply','as','at','audio','background','brightness','by','contrast','delay','delayed','extract','fadeIn','fadeOut','font','fontcolor','fontsize','for','from','left','load','normalize','of','opacity','options','position','project','repetitions','right','rotation','saturation','scale','size','stereo','subtitle','text','to','video','volume'
    ],
    operators: [
        ',',':'
    ],
    symbols: /,|:/,

    tokenizer: {
        initial: [
            { regex: /(fadeout|fadein)/, action: {"token":"VIDEO_TRANSITION_TYPE"} },
            { regex: /(((("center"|"left")|"right")|"top")|"bottom")/, action: {"token":"ALIGNMENT"} },
            { regex: /(start|end)/, action: {"token":"RELATIVE_PLACEMENT"} },
            { regex: /(above|under)/, action: {"token":"LAYER_PLACEMENT"} },
            { regex: /#[0-9]+/, action: {"token":"string"} },
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /[-+][0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?/, action: {"token":"string"} },
            { regex: /[0-5][0-9]:[0-5][0-9](\.[0-9]{1,3})?/, action: {"token":"string"} },
            { regex: /-?[0-9]*\.[0-9]+/, action: {"token":"number"} },
            { regex: /-?[0-9]+/, action: {"token":"number"} },
            { regex: /"[^"]*"|'[^']*'/, action: {"token":"string"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[/\*]/, action: {"token":"comment"} },
        ],
    }
};
}
// GENERATED CODE - END

/**
 * Retrieves the program code to display, either a default or from local storage
 */
export function getMainCode() {
    let mainCode = `video project "resultat_scenario_1"

// Update the paths below to point to your own video files or use the file input to upload them
load video "path_to_video_here" as video1
load video "path_to_video_here" as video2

text "Nous étions en vacances en Italie! :)" as textDebut
text "Merci d'avoir regardé nos vidéos de vacances! :)" as textFin

#1: textDebut for 00:10
#2: video1
#3: video2
#4: textFin for 00:15
`;
    
    // seek to restore any previous code from our last session
    if (window.localStorage) {
        const storedCode = window.localStorage.getItem('videoml_mainCode');
        if (storedCode !== null) {
            mainCode = storedCode;
        }
    }

    return mainCode;
}

/**
 * Creates & returns a fresh worker using the VideoML language server
 */
export function getWorker(path: string) {
    return new Worker(path, {
        type: 'module',
        name: 'VideoML-LS'
    });
}
