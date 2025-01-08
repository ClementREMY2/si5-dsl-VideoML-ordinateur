const cache = new Map<string, number>();

export const getCachedVideoDuration = async (path: string): Promise<number> => {
    if (cache.has(path)) {
        const duration = cache.get(path);
        if (duration) {
            return duration;
        }
    }

    const absolutePath = await window.ipcRenderer.invoke('resolve-path', path);
    const platform = await window.ipcRenderer.invoke('get-process-platform');
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        
        // Handle Windows paths
        const videoSrc = platform === 'win32' ? `file:///${absolutePath.replace(/\\/g, '/')}` : `file://${absolutePath}`;

        videoElement.src = videoSrc;
        videoElement.onloadedmetadata = () => {
            cache.set(path, videoElement.duration);
            resolve(videoElement.duration);
        };
        videoElement.onerror = () => {
            resolve(-1);
            // reject(error);
        };
        videoElement.load();
    });
};