import { getCachedVideoDuration } from "./video-duration-getter";

export const renderedValidationHandlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => Promise<any>;
} = {
    'get-video-original-duration': getVideoOriginalDuration,
}

async function getVideoOriginalDuration({ path }: { path: string}): Promise<number | null> {
    return getCachedVideoDuration(path);
}