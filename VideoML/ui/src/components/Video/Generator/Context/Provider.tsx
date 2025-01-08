import React, { useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { VideoGeneratorContext, VideoGenerationProgress } from './Context';
import { usePythonVisualizer } from '../../../PythonVisualizer/Context/Context';
import { VideoGeneratorModal } from '../Modal';

interface VideoGeneratorProviderProps {
    children: ReactNode;
}

export const VideoGeneratorProvider: React.FC<VideoGeneratorProviderProps> = ({ children }) => {
    const { pythonCode } = usePythonVisualizer();
    const [generationProgress, setGenerationProgress] = useState<VideoGenerationProgress | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [videoGeneratedPath, setVideoGeneratedPath] = useState<string | undefined>(undefined);
    const [errorTraceback, setErrorTraceback] = useState<string | undefined>(undefined);

    const handleGenerateVideo = useCallback(async () => {
        setIsGenerating(true);
        setErrorTraceback(undefined);

        const pwd = await window.ipcRenderer.invoke('get-pwd');
        // Extract the video filename, Export line is : 'final_video.write_videofile("XXX")', use regex
        const videoName = pythonCode.match(/final_video\.write_videofile\("(.+)"\)/)?.[1];
        setVideoGeneratedPath(`${pwd}/${videoName}`);

        await window.ipcRenderer.invoke('generate-python-file', pythonCode, pwd);

        window.ipcRenderer.invoke('generate-video', pwd);
    }, [pythonCode]);

    useEffect(() => {
        const handleProgress = (progress: VideoGenerationProgress) => {
            setGenerationProgress(progress);
        };

        const handleFinished = (code: number) => {
            setGenerationProgress(undefined);
            setIsGenerating(false);
            if (!Number.isInteger(code)) {
                setVideoGeneratedPath(undefined);
            }
        };

        const handleError = (error: string) => {
            setErrorTraceback((prev) => prev ? `${prev}\n${error}` : error);
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
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath: isGenerating ? undefined : videoGeneratedPath,
        errorTraceback,
    }), [
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath,
        errorTraceback,
    ]);

    return (
        <VideoGeneratorContext.Provider value={value}>
        {isGenerating && (
            <VideoGeneratorModal generationProgress={generationProgress} />
        )} 
        {children}
        </VideoGeneratorContext.Provider>
    );
};