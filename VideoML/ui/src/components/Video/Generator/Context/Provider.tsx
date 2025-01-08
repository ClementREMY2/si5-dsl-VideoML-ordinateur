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

    const handleGenerateVideo = useCallback(async () => {
        setIsGenerating(true);

        const pwd = await window.ipcRenderer.invoke('get-pwd');
        // Extract the video filename, Export line is : 'final_video.write_videofile("XXX")', use regex
        const videoName = pythonCode.match(/final_video\.write_videofile\("(.+)"\)/)?.[1];
        setVideoGeneratedPath(`${pwd}/${videoName}`);

        await window.ipcRenderer.invoke('generate-python-file', pythonCode, pwd);

        window.ipcRenderer.invoke('generate-video', pwd);
    }, [pythonCode]);

    useEffect(() => {
        const handleProgress = (_: Electron.IpcRendererEvent, progress: VideoGenerationProgress) => {
            setGenerationProgress(progress);
        };

        const handleFinished = (_: Electron.IpcRendererEvent, code: number) => {
            setGenerationProgress(undefined);
            setIsGenerating(false);
            if (!Number.isInteger(code)) {
                setVideoGeneratedPath(undefined);
            }
        };

        window.ipcRenderer.on('video-generation-progress', handleProgress);
        window.ipcRenderer.on('video-generation-finished', handleFinished);
        return () => {
            window.ipcRenderer.removeListener('video-generation-progress', handleProgress);
            window.ipcRenderer.removeListener('video-generation-finished', handleFinished);
        };
    }, []);

    const value = useMemo(() => ({
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath: isGenerating ? undefined : videoGeneratedPath,
    }), [
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath,
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