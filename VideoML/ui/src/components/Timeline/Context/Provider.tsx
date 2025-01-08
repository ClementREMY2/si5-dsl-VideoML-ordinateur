import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { TimelineContext, PopulatedTimelineElementInfo } from './Context';
import { TimelineElementInfo } from '../../../../lib/generated/generator/types';

interface TimelineProviderProps {
    children: ReactNode;
}

const getStartAtRecursively = (element: PopulatedTimelineElementInfo, timelineElementInfos: PopulatedTimelineElementInfo[]): number => {
    if (!element.relativePlacement) return element.startAt || 0;

    const relativeToElement = timelineElementInfos.find((e) => e.name === element.relativePlacement?.relativeTo);
    if (!relativeToElement) return 0;

    const relativeStartAt = getStartAtRecursively(relativeToElement, timelineElementInfos);

    return relativeStartAt + element.relativePlacement.offset + (element.relativePlacement.place === 'END' ? relativeToElement.videoElement?.duration || 0 : 0);
}

const resolvePath = async (filePath: string): Promise<string> => {
    return window.ipcRenderer.invoke('resolve-path', filePath);
}

const getPlatformProcess = async (): Promise<NodeJS.Platform> => {
    return window.ipcRenderer.invoke('get-process-platform');
}
  
const loadVideoDuration = async (absolutePath: string, platform: NodeJS.Platform): Promise<number> => {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        
        // Handle Windows paths
        const videoSrc = platform === 'win32' ? `file:///${absolutePath.replace(/\\/g, '/')}` : `file://${absolutePath}`;

        videoElement.src = videoSrc;
        videoElement.onloadedmetadata = () => {
            resolve(videoElement.duration);
        };
        videoElement.onerror = (error) => {
            reject(error);
        };
        videoElement.load();
    });
};

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
const [timelineElementInfos, setTimelineElementInfos] = useState<PopulatedTimelineElementInfo[]>([]);
const [isTimelineLoaded, setIsTimelineLoaded] = useState(false);

const handleNewTimelineElementInfos = useCallback(async (newTimelineElementInfos: TimelineElementInfo[]) => {
    setIsTimelineLoaded(true);

    // Populate video element with their duration
   const populatedDurationElements = await Promise.all(newTimelineElementInfos.map(async (element: PopulatedTimelineElementInfo) => {
        // Get duration for each element
        if (element.videoElement) {
            if (element.videoElement.duration) {
                return element;
            }

            if (!element.videoElement.filePath) {
                element.error = 'NO_FILEPATH';
                return element;
            }

            try {
                const resolvedPath = await resolvePath(element.videoElement.filePath);
                const platform = await getPlatformProcess();
                const duration = await loadVideoDuration(resolvedPath, platform);
                element.videoElement.duration = duration;
            } catch (error) {
                console.error('Error loading video:', error);
                element.error = 'LOAD_VIDEO';
            }
        }

        return element;
    }));

    // Resolve startAt and finishAt time for each relative element
    const populatedElements = populatedDurationElements.map((element) => {
        if (element.error) return element;

        if (element.relativePlacement) {
            element.startAt = getStartAtRecursively(element, populatedDurationElements);
        }

        element.finishAt = (element.startAt || 0) + (element.videoElement?.duration || 0);

        return element;
    });

    setTimelineElementInfos(populatedElements);
}, []);

const value = useMemo(() => ({
    timelineElementInfos,
    handleNewTimelineElementInfos,
    isTimelineLoaded,
}), [
    timelineElementInfos,
    handleNewTimelineElementInfos,
    isTimelineLoaded,
]);

return (
    <TimelineContext.Provider value={value}>
    {children}
    </TimelineContext.Provider>
);
};