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

        await window.ipcRenderer.invoke('generate-python-file', pythonCode, pwd);

        await window.ipcRenderer.invoke('generate-video', pwd);

        setIsGenerating(false);
        setVideoGeneratedPath(`${pwd}/${videoName}`);
        setGenerationProgress(undefined);
    }, [pythonCode]);

    useEffect(() => {
        const handleProgress = (_: Electron.IpcRendererEvent, progress: VideoGenerationProgress) => {
            setGenerationProgress(progress);
        };

        window.ipcRenderer.on('video-generation-progress', handleProgress);
        return () => {
            window.ipcRenderer.removeListener('video-generation-progress', handleProgress);
        };
    }, []);

    const value = useMemo(() => ({
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath,
    }), [
        generationProgress,
        handleGenerateVideo,
        isGenerating,
        videoGeneratedPath,
    ]);

    return (
        <VideoGeneratorContext.Provider value={value}>
        {isGenerating && generationProgress && (
            <VideoGeneratorModal generationProgress={generationProgress} />
        )} 
        {children}
        </VideoGeneratorContext.Provider>
    );
};