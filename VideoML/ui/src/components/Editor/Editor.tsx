import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoEditorLanguageClientWrapper } from "monaco-editor-wrapper/bundle";
import { useEffect, useRef } from 'react';

import { createUserConfig, getMainCode, getWorker, getMonarchGrammar } from '../../lib/video-ml';
import { useTimeline } from '../Timeline/Context/Context';
import { usePythonVisualizer } from '../PythonVisualizer/Context/Context';
import { renderedValidationHandlers } from '../../lib/validators';

const platform = await window.ipcRenderer.invoke('get-process-platform');

const isAudio = (file: File) => file.type.startsWith('audio/');
const isVideo = (file: File) => file.type.startsWith('video/');

type EditorProps = {
    className?: string;
    style?: React.CSSProperties;
    mc: string;
    vml: string;
    filesToInsert: File[];
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
            let newModelValue = value;

            filesToInsert.forEach((file) => {
                // Get varname from file name e.g. video.mp4 -> video (whitespace removed)
                const varName = file.name.replace(/\s/g, '').replace(/\.[^/.]+$/, '');
                // If machine under windows, replace backslashes with forward slashes and keep only the path with and after the first slash.
                
                // Generate the line to insert
                const path = platform === 'win32' ? file.path.replace(/^.*?\\/, '/').replace(/\\/g, '/') : file.path;
                let lineToInsert: string = '';
                if (isVideo(file)) lineToInsert =  `load video "${path}" as ${varName}`;
                else if (isAudio(file)) lineToInsert =  `load audio "${path}" as ${varName}`;

                // Process line where to insert the new line
                let lastLoadMatch;
                let loadIndex = -1;

                const loadVideoMatches = [...newModelValue.matchAll(/load video.*\n/g)];
                const loadAudioMatches = [...newModelValue.matchAll(/load audio.*\n/g)];

                if (isVideo(file)) {
                    // Find the last occurrence of 'load video ... \n'
                    lastLoadMatch = loadVideoMatches[loadVideoMatches.length - 1];
                    loadIndex = lastLoadMatch ? lastLoadMatch.index + lastLoadMatch[0].length : -1;
                } else if (isAudio(file)) {
                    // Find the last occurrence of 'load audio ... \n'
                    lastLoadMatch = loadAudioMatches[loadAudioMatches.length - 1];
                    loadIndex = lastLoadMatch ? lastLoadMatch.index + lastLoadMatch[0].length : -1;
                }

                // Find the index of 'video project ... \n'
                const videoProjectMatches = [...newModelValue.matchAll(/video project.*\n/g)];
                const videoProjectMatch = videoProjectMatches[0];
                const videoProjectIndex = videoProjectMatch ? videoProjectMatch.index + videoProjectMatch[0].length : -1;

                // Determine the insert index
                const insertIndex = loadIndex > -1 ? loadIndex : videoProjectIndex > -1 ? videoProjectIndex : 0;

                // Insert new videos after the determined index
                newModelValue = insertIndex > 0
                    ? newModelValue.slice(0, insertIndex) + (!lastLoadMatch ? '\n' : '') + lineToInsert + '\n' + newModelValue.slice(insertIndex)
                    : 'video project "name_your_project"\n\n' + lineToInsert + '\n';
            });

            model.setValue(newModelValue);
            onInsertCode();
        }
    }, [filesToInsert, onInsertCode]);

  return (
    <div className={className} ref={editorRef} style={style} />
  );
}
