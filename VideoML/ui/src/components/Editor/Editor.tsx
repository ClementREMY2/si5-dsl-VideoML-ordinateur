import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper/bundle";
import { useEffect, useRef } from 'react';

import { createUserConfig, getMainCode, getWorker, getMonarchGrammar } from '../../lib/video-ml';
import { useTimeline } from '../Timeline/Context/Context';
import { usePythonVisualizer } from '../PythonVisualizer/Context/Context';
import { renderedValidationHandlers } from '../../lib/validators';

type EditorProps = {
    className?: string;
    style?: React.CSSProperties;
    mc: string;
    vml: string;
    filesToInsert: string[];
    onInsertCode: () => void;
};

export const Editor = ({
    className,
    style,
    mc,
    vml,
    filesToInsert,
    onInsertCode,
}: EditorProps) => {
    const editorRef = useRef(null);
    const editorInitializedRef = useRef(false);
    const wrapperRef = useRef<MonacoEditorLanguageClientWrapper | null>(null);

    const { handleNewTimelineElementInfos, setIsVideoMLProgramValid } = useTimeline();
    const { setPythonCode, setIsPythonCodeLoaded } = usePythonVisualizer();

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
            wrapperRef.current = wrapper;
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

            worker.addEventListener('message', async (event) => {
                const { id, method, params } = event.data || {};
                if (id && method && params && method.startsWith('custom/')) {
                    if (params.executionParams.needNodeJs) {
                        window.ipcRenderer.invoke(method.slice(7), { ...params.commandParams, indexName: params.indexName }).then((result) => {
                            worker.postMessage({
                                jsonrpc: "2.0",
                                id,
                                result: {
                                    content: result,
                                    indexName: params.indexName,
                                }
                            });
                        });
                    } else {
                        const result = await renderedValidationHandlers[method.slice(7)](params.commandParams);
                        worker.postMessage({
                            jsonrpc: "2.0",
                            id,
                            result: {
                                content: result,
                                indexName: params.indexName,
                            }
                        });
                    }
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
                    // console.info('processing code...', resp);

                    // decode & extract timeline element infos
                    const result = JSON.parse(resp.content);
                    // console.log('result:', { result });
                    const infos = result.$timelineElementInfos;
                    const code = result.$pythonCode;
                    try {
                        if (result.$isValid) {
                            handleNewTimelineElementInfos(infos);
                            setPythonCode(code);
                            setIsPythonCodeLoaded(true);
                        }
                        setIsVideoMLProgramValid(!!result.$isValid);
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
    });

    useEffect(() => {
        if (!wrapperRef.current) return;

        const model = wrapperRef.current.getModel();
        if (model && filesToInsert.length > 0) {
            const value = model.getValue();
            const newFilesToInsert = filesToInsert.join('\n');

            const isVideo = filesToInsert.some(file => file.includes('.mp4'));
            const isAudio = filesToInsert.some(file => file.includes('.mp3'));

            let lastLoadMatch;
            let loadIndex = -1;

            const loadVideoMatches = [...value.matchAll(/load video.*\n/g)];
            const loadAudioMatches = [...value.matchAll(/load audio.*\n/g)];

            if (isVideo) {
                // Find the last occurrence of 'load video ... \n'
                lastLoadMatch = loadVideoMatches[loadVideoMatches.length - 1];
                loadIndex = lastLoadMatch ? lastLoadMatch.index + lastLoadMatch[0].length : -1;
                console.log('loadIndex video', loadIndex);
            } else if (isAudio) {
                // Find the last occurrence of 'load audio ... \n'
                lastLoadMatch = loadAudioMatches[loadAudioMatches.length - 1];
                loadIndex = lastLoadMatch ? lastLoadMatch.index + lastLoadMatch[0].length : -1;
                console.log('loadIndex audio', loadIndex);
            } else {
                console.log("prout");
            }

            // Find the index of 'video project ... \n'
            const videoProjectMatches = [...value.matchAll(/video project.*\n/g)];
            const videoProjectMatch = videoProjectMatches[0];
            const videoProjectIndex = videoProjectMatch ? videoProjectMatch.index + videoProjectMatch[0].length : -1;

            // Determine the insert index
            const insertIndex = loadIndex > -1 ? loadIndex : videoProjectIndex > -1 ? videoProjectIndex : 0;

            // Insert new videos after the determined index
            const newValue = insertIndex > 0
                ? value.slice(0, insertIndex) + (!lastLoadMatch ? '\n' : '') + newFilesToInsert + '\n' + value.slice(insertIndex)
                : 'video project "name_your_project"\n\n' + newFilesToInsert + '\n';

            model.setValue(newValue);
            onInsertCode();
        }
    }, [filesToInsert, onInsertCode]);

  return (
    <div className={className} ref={editorRef} style={style} />
  );
}
