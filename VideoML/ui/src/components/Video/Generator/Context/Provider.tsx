import React, { useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { VideoGeneratorContext, VideoGenerationStatus, VideoGenerationProgress } from './Context';
import { usePythonVisualizer } from '../../../PythonVisualizer/Context/Context';
import { VideoGeneratorModal } from '../Modal';

interface VideoGeneratorProviderProps {
    children: ReactNode;
}

export const VideoGeneratorProvider: React.FC<VideoGeneratorProviderProps> = ({ children }) => {
    const { pythonCode } = usePythonVisualizer();
    const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [videoGeneratedPath, setVideoGeneratedPath] = useState<string | undefined>(undefined);
    const [errorTraceback, setErrorTraceback] = useState<string | undefined>(undefined);
    const [manualInstallationInstructions, setManualInstallationInstructions] = useState<string | undefined>(undefined);

    const handleGenerateVideo = useCallback(async () => {
        setIsGenerating(true);
        setErrorTraceback(undefined);
        setManualInstallationInstructions(undefined);

        const pwd = await window.ipcRenderer.invoke('get-pwd');
        // Extract the video filename, Export line is : 'final_video.write_videofile("XXX")', use regex
        const videoName = pythonCode.match(/final_video\.write_videofile\("(.+)"\)/)?.[1];
        setVideoGeneratedPath(`${pwd}/${videoName}`);

        await window.ipcRenderer.invoke('generate-python-file', pythonCode, pwd);

        // Check python binary
        const isPythonInstalled = await window.ipcRenderer.invoke('is-python-installed');
        if (!isPythonInstalled) {
            const platform = await window.ipcRenderer.invoke('get-process-platform');
            const pythonBin = platform === "win32" ? "py" : "python3";
            setErrorTraceback(`Can't find python binary (need python 3.9+ and binary in PATH accessible by "${pythonBin}" command).`);
            setManualInstallationInstructions(
`You can execute manually the video generation:<br>
- Install the python requirements provided in this file <a href="#" onclick="window.ipcRenderer.invoke('show-file-in-folder', '${pwd}/requirements.txt')">requirements.txt</a> (${pwd}/requirements.txt)<br>
- Launch this file with the python interpreter <a href="#" onclick="window.ipcRenderer.invoke('show-file-in-folder', '${pwd}/video.py')">video.py</a> (${pwd}/video.py)`);
            setIsGenerating(false);
            return;
        }

        // Install requirements
        const requirementsInstallResult = await window.ipcRenderer.invoke('install-requirements');
        if (!requirementsInstallResult) {
            setErrorTraceback('Failed to install requirements, please check Electron logs.');
            setIsGenerating(false);
            return;
        }

        window.ipcRenderer.invoke('generate-video', pwd);
    }, [pythonCode]);

    useEffect(() => {
        const handleProgress = (progress: VideoGenerationProgress) => {
            const isChunk = progress.isChunk;
            setGenerationStatus((prev) => ({
                ...prev,
                [isChunk ? 'chunk' : 'frameIndex']: progress,
            }));
        };

        const handleFinished = (code: number) => {
            setGenerationStatus(undefined);
            setIsGenerating(false);
            if (!Number.isInteger(code)) {
                setVideoGeneratedPath(undefined);
            }
        };

        const handleError = (error: string) => {
            // Check if error traceback is not empty and don't contains only whitespaces
            if (!error.match(/^\s*$/) && error.indexOf('warnings.warn') === -1) {
                setErrorTraceback((prev) => prev ? `${prev}\n${error}` : error);
            }
        };

        const eventProgressRemoveListener = window.ipcRenderer.receive('video-generation-progress', handleProgress);
        const eventFinishedRemoveListener = window.ipcRenderer.receive('video-generation-finished', handleFinished);
        const eventErrorRemoveListener = window.ipcRenderer.receive('video-generation-error', handleError);
        return () => {
            eventProgressRemoveListener();
            eventFinishedRemoveListener();
            eventErrorRemoveListener();
        };
    }, []);

    const value = useMemo(() => ({
        generationStatus,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath: isGenerating ? undefined : videoGeneratedPath,
        errorTraceback,
        manualInstallationInstructions,
    }), [
        generationStatus,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath,
        errorTraceback,
        manualInstallationInstructions,
    ]);

    return (
        <VideoGeneratorContext.Provider value={value}>
        {isGenerating && (
            <VideoGeneratorModal generationStatus={generationStatus} />
        )} 
        {children}
        </VideoGeneratorContext.Provider>
    );
};