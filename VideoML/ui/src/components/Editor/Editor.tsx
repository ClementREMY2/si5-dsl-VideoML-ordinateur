import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper/bundle";
import { useEffect, useRef } from 'react';

import { createUserConfig, getMainCode, getWorker, getMonarchGrammar } from '../../lib/video-ml';
import { useTimeline } from '../Timeline/Context/Context';

type EditorProps = {
    className?: string;
    style?: React.CSSProperties;
    mc: string;
    vml: string;
};

export const Editor = ({ className, style, mc, vml }: EditorProps) => {
    const editorRef = useRef(null);
    const editorInitializedRef = useRef(false);
    const { handleNewTimelineElementInfos } = useTimeline();

    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(mc, { type: 'module' })
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
                worker: getWorker(vml),
                monarchGrammar: getMonarchGrammar()
            })
            await wrapper.initAndStart(userConfig, editorRef.current);

            const worker = wrapper.getLanguageClientWrapper()?.getWorker();
            if (!worker) {
                throw new Error('Unable to obtain worker for the VideoML!');
            }

            worker.addEventListener('message', (event) => {
                const { id, method, params } = event.data || {};
                if (id && method && params && method.startsWith('custom/')) {
                    window.ipcRenderer.invoke(method.slice(7), params.path).then((result) => {
                        worker.postMessage({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                content: result,
                                indexName: params.indexName,
                            }
                        });
                    });
                }
            });

            const client = wrapper.getLanguageClient();
            if (!client) {
                throw new Error('Unable to obtain language client for the VideoML!');
            }

            let running = false;
            let timeout: NodeJS.Timeout | null = null;
            client.onNotification('browser/DocumentChange', (resp) => {
                // always store this new program in local storage
                const value = wrapper.getModel()?.getValue();
                if (window.localStorage && value) {
                    window.localStorage.setItem('videoml_mainCode', value);
                }

                // block until we're finished with a given run
                if (running) return;
                
                // clear previous timeouts
                if (timeout) clearTimeout(timeout);

                // set a timeout to run the current code
                timeout = setTimeout(async () => {
                    running = true;
                    console.info('processing code...', resp);

                    // decode & extract timeline element infos
                    const result = JSON.parse(resp.content);
                    const infos = result.$timelineElementInfos;
                    try {
                        handleNewTimelineElementInfos(infos);
                        running = false;
                    } catch (e) {
                        // failed at some point, log & disable running so we can try again
                        console.error(e);
                        running = false;
                    }

                }, 200);
            });
        };

        if (!editorInitializedRef.current) {
            setup();
            editorInitializedRef.current = true;
        }
    })

  return (
    <div className={className} ref={editorRef} style={style} />
  );
}
