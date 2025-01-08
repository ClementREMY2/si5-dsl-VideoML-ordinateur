import { useEffect, useRef } from "react";

const getPlatformProcess = async (): Promise<NodeJS.Platform> => {
    return window.ipcRenderer.invoke('get-process-platform');
}

const videoPath = "/Users/alexismalosse/Downloads/sample_1280x720.mp4";

type VideoPlayerProps = {
    className?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ className }) => {
    const videoPlayerRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoPlayerRef.current) return;

        const setupVideo = async () => {
            if (!videoPlayerRef.current) return;
            const platform = await getPlatformProcess();

            const videoElement = videoPlayerRef.current;
            
            // Handle Windows paths
            const videoSrc = platform === 'win32' ? `file:///${videoPath.replace(/\\/g, '/')}` : `file://${videoPath}`;

            videoElement.src = videoSrc;
            videoElement.load();
        }

        setupVideo();
    }, []);

    return (
        <div className={className}>
            <video controls height="100%" ref={videoPlayerRef} />
        </div>
    )
}