import { getCachedVideoDuration } from "./video-duration-getter";
import { getCachedAudioDuration } from "./audio-duration-getter"

export const renderedValidationHandlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => Promise<any>;
} = {
    'get-video-original-duration': getVideoOriginalDuration,
    'get-audio-original-duration': getAudioOriginalDuration,
}

async function getVideoOriginalDuration({ path }: { path: string}): Promise<number> {
    return getCachedVideoDuration(path);
}

async function getAudioOriginalDuration({ path }: { path: string}): Promise<number> {
    return getCachedAudioDuration(path);
}