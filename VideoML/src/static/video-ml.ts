import { MonacoEditorLanguageClientWrapper, UserConfig } from "monaco-editor-wrapper/bundle";
import { useWorkerFactory } from "monaco-editor-wrapper/workerFactory";

export type WorkerUrl = string;

/**
 * Generalized configuration used with 'getMonacoEditorReactConfig' to generate a working configuration for monaco-editor-react
 */
export interface ClassicConfig {
    code: string,
    languageId: string,
    worker: WorkerUrl | Worker,
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
                languageDef: config.monarchGrammar
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

/**
 * Prepare to setup the wrapper, building the worker def & setting up styles
 */
function setup() {
    const workerUrl = new URL('monaco-editor-wrapper/dist/workers/editorWorker-es.js', window.location.href).href;
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(workerUrl, { type: 'module' })
        }
    });
}

// GENERATED CODE - START
/**
 * Returns a Monarch grammar definition for MiniLogo
 */
function getMonarchGrammar() {
    return {
    keywords: [
        'add','as','at','by','delayed','end','in','layer','load','of','project','start','timeline','to','video'
    ],
    operators: [
        '+'
    ],
    symbols: /\+/,

    tokenizer: {
        initial: [
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"ID"} }} },
            { regex: /[-+][0-5][0-9]:[0-5][0-9]/, action: {"token":"string"} },
            { regex: /[0-5][0-9]:[0-5][0-9]/, action: {"token":"string"} },
            { regex: /[0-9]+/, action: {"token":"number"} },
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
function getMainCode() {
    let mainCode = `
video project "output"

load video "testPath.mp4" in video1
load video "testPath2.mp4" in video2

add video1 as first to timeline at 00:00
add video1 as second to timeline at 00:15 in layer 5
add video2 as third to timeline at start of first delayed by +00:05
    `;
    
    // seek to restore any previous code from our last session
    if (window.localStorage) {
        const storedCode = window.localStorage.getItem('mainCode');
        if (storedCode !== null) {
            mainCode = storedCode;
        }
    }

    return mainCode;
}

/**
 * Creates & returns a fresh worker using the VideoML language server
 */
function getWorker() {
    const workerURL = new URL('video-ml-server-worker.js', window.location.href);
    return new Worker(workerURL.href, {
        type: 'module',
        name: 'VideoML-LS'
    });
}

/**
 * Set a status message to display below the update button
 * @param msg Status message to display
 */
function setStatus(msg: string) {
    const elm = document?.getElementById('status-msg');
    if (elm) {
        elm.innerHTML = msg;
    }
}

async function main() {
    // setup worker def & styles
    setup();
    
    // setup a new wrapper
    // keep a reference to a promise for when the editor is finished starting, we'll use this to setup the canvas on load
    const wrapper = new MonacoEditorLanguageClientWrapper();
    const userConfig = createUserConfig({
        languageId: 'videoml',
        code: getMainCode(),
        worker: getWorker(),
        monarchGrammar: getMonarchGrammar()
    })
    await wrapper.initAndStart(userConfig, document.getElementById("monaco-editor-root")!);

    const client = wrapper.getLanguageClient();
    if (!client) {
        throw new Error('Unable to obtain language client for the Video/L!');
    }

    let running = false;
    let timeout: NodeJS.Timeout | null = null;
    client.onNotification('browser/DocumentChange', (resp) => {

        // always store this new program in local storage
        const value = wrapper.getModel()?.getValue();
        if (window.localStorage && value) {
            window.localStorage.setItem('mainCode', value);
        }

        // block until we're finished with a given run
        if (running) {
            return;
        }
        
        // clear previous timeouts
        if (timeout) {
            clearTimeout(timeout);
        }

        // set a timeout to run the current code
        timeout = setTimeout(async () => {
            running = true;
            setStatus('');
            console.info('generating & running current code...');

            // decode & run commands
            let result = JSON.parse(resp.content);
            // let commands = result.$commands;
            // try {
            //     await updateMiniLogoCanvas(commands);
            //     running = false;
            // } catch (e) {
            //     // failed at some point, log & disable running so we can try again
            //     console.error(e);
            //     running = false;
            // }

            let stringResult = result.$string;
            running = false;

            console.log({ stringResult });

        }, 200);
    });
}

main();
