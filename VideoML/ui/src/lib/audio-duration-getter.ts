const cache = new Map<string, number>();

export const getCachedAudioDuration = async (path: string): Promise<number> => {
    if (cache.has(path)) {
        const duration = cache.get(path);
        if (duration) {
            return duration;
        }
    }

    const absolutePath = await window.ipcRenderer.invoke('resolve-path', path);
    const platform = await window.ipcRenderer.invoke('get-process-platform');
    return new Promise((resolve, reject) => {
        const audioElement = document.createElement('audio');
        
        // Handle Windows paths
        const audioSrc = platform === 'win32' ? `file:///${absolutePath.replace(/\\/g, '/')}` : `file://${absolutePath}`;

        audioElement.src = audioSrc;
        audioElement.onloadedmetadata = () => {
            cache.set(path, audioElement.duration);
            resolve(audioElement.duration);
        };
        audioElement.onerror = () => {
            resolve(-1);
            // reject(error);
        };
        audioElement.load();
    });
};