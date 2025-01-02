import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper/bundle";
import { useEffect, useRef } from 'react';

import { createUserConfig, getMainCode, getWorker, getMonarchGrammar } from './lib/video-ml';

const workerUrl = new URL('monaco-editor-wrapper/dist/workers/editorWorker-es.js', window.location.href).href;

type EditorProps = {
    style?: React.CSSProperties;
};

export const Editor = ({ style }: EditorProps) => {
    const editorRef = useRef(null);
    const editorInitializedRef = useRef(false);

    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(workerUrl, { type: 'module' })
        }
    });

    useEffect(() => {
        if (!editorRef.current) return;

        const setup = async () => {
            // setup a new wrapper
            // keep a reference to a promise for when the editor is finished starting, we'll use this to setup the canvas on load
            const wrapper = new MonacoEditorLanguageClientWrapper();
            const userConfig = createUserConfig({
                languageId: 'videoml',
                code: getMainCode(),
                worker: getWorker(),
                monarchGrammar: getMonarchGrammar()
            })
            await wrapper.initAndStart(userConfig, editorRef.current);

            const client = wrapper.getLanguageClient();
            if (!client) {
                throw new Error('Unable to obtain language client for the VideoML!');
            } else console.log('Connected to language client!');


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
                    // setStatus('');
                    console.info('generating & running current code...');

                    // decode & run commands
                    const result = JSON.parse(resp.content);
                    // let commands = result.$commands;
                    // try {
                    //     await updateMiniLogoCanvas(commands);
                    //     running = false;
                    // } catch (e) {
                    //     // failed at some point, log & disable running so we can try again
                    //     console.error(e);
                    //     running = false;
                    // }

                    const stringResult = result.$string;
                    running = false;

                    console.log({ stringResult });

                }, 200);
            });
        };

        if (!editorInitializedRef.current) {
            setup();
            editorInitializedRef.current = true;
        }
    })

  return (
    <div id="monaco-editor-root" ref={editorRef} style={style} />
  );
}
