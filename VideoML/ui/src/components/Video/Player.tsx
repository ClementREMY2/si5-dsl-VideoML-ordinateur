import { useEffect, useRef } from "react";
import { useVideoGenerator } from "./Generator/Context/Context";

const getPlatformProcess = async (): Promise<NodeJS.Platform> => {
    return window.ipcRenderer.invoke('get-process-platform');
}

type VideoPlayerProps = {
    className?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ className }) => {
    const { videoGeneratedPath, isGenerating, errorTraceback } = useVideoGenerator();
    const videoContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!videoContainerRef.current) return;

        const setupVideo = async () => {
            if (!videoContainerRef.current) return;
            videoContainerRef.current.innerHTML = '';
            if (!videoGeneratedPath || errorTraceback) return;

            const platform = await getPlatformProcess();

            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.classList.add('h-100');
            
            // Handle Windows paths
            const videoSrc = platform === 'win32' ? `file:///${videoGeneratedPath.replace(/\\/g, '/')}` : `file://${videoGeneratedPath}`;

            videoElement.src = videoSrc;
            videoElement.load();

            videoContainerRef.current.appendChild(videoElement);
        }

        setupVideo();
    }, [videoGeneratedPath, errorTraceback]);

    return (
        <div className={className}>
            {isGenerating && (<div>Generating...</div>)}
            {!isGenerating && !errorTraceback && videoGeneratedPath && (
                <div className="h-100 w-100 d-flex justify-content-center align-items-center" ref={videoContainerRef} />
            )}
            {!isGenerating && !videoGeneratedPath && (
                <div>No video generated yet</div>
            )}
            {errorTraceback && (
                <>
                    <div className="text-danger mb-2">An error occured during generation:</div>
                    <pre>{errorTraceback}</pre>
                </>
            )}
        </div>
    )
}