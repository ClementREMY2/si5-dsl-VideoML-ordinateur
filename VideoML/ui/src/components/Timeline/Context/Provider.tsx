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
  
const loadVideoDuration = async (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        videoElement.src = `file://${filePath}`;
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

const handleNewTimelineElementInfos = useCallback(async (newTimelineElementInfos: TimelineElementInfo[]) => {
    console.log('New timeline element infos:', newTimelineElementInfos);

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
                const duration = await loadVideoDuration(element.videoElement.filePath);
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
}), [
    timelineElementInfos,
    handleNewTimelineElementInfos,
]);

return (
    <TimelineContext.Provider value={value}>
    {children}
    </TimelineContext.Provider>
);
};