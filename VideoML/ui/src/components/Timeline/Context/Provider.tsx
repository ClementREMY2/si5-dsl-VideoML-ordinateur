import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { TimelineContext, PopulatedTimelineElementInfo } from './Context';
import { TimelineElementInfo } from '../../../../lib/generated/generator/types';
import { getCachedVideoDuration } from '../../../lib/video-duration-getter';

interface TimelineProviderProps {
    children: ReactNode;
}

const getStartAtRecursively = (element: PopulatedTimelineElementInfo, timelineElementInfos: PopulatedTimelineElementInfo[]): number => {
    if (!element.relativePlacement) return element.startAt || 0;

    const relativeToElement = timelineElementInfos.find((e) => e.name === element.relativePlacement?.relativeTo);
    if (!relativeToElement) return 0;

    const relativeStartAt = getStartAtRecursively(relativeToElement, timelineElementInfos);

    if (element.videoOriginalElement) { 
        return relativeStartAt + element.relativePlacement.offset + (element.relativePlacement.place === 'END' ? relativeToElement.videoOriginalElement?.duration || 0 : 0);
    }
    else if (element.videoExtractElement) {
        return relativeStartAt + element.relativePlacement.offset + (element.relativePlacement.place === 'END' ? relativeToElement.videoExtractElement?.duration || 0 : 0);
    }
    else if (element.audioElement) {
        return relativeStartAt + element.relativePlacement.offset + (element.relativePlacement.place === 'END' ? relativeToElement.audioElement?.duration || 0 : 0);
    }
    else {
        return 0;
    }
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
const [timelineElementInfos, setTimelineElementInfos] = useState<PopulatedTimelineElementInfo[]>([]);
const [isTimelineLoaded, setIsTimelineLoaded] = useState(false);

const handleNewTimelineElementInfos = useCallback(async (newTimelineElementInfos: TimelineElementInfo[]) => {
    setIsTimelineLoaded(true);

    // Populate video element with their duration
   const populatedDurationElements = await Promise.all(newTimelineElementInfos.map(async (element: PopulatedTimelineElementInfo) => {
        // Get duration for each element
        if (element.videoOriginalElement) {

            if (element.videoOriginalElement.duration) {
                return element;
            }

            if (!element['videoOriginalElement']['filePath']) {
                element['error'] = 'NO_FILEPATH';
                return element;
            }

            try {
                element.videoOriginalElement.duration = await getCachedVideoDuration(element.videoOriginalElement.filePath);
            } catch (error) {
                console.error('Error loading video:', error);
                element.error = 'LOAD_VIDEO';
            }
        }
        else if (element.audioElement) {

            if (element.audioElement.duration) {
                return element;
            }

            if (!element['audioElement']['filePath']) {
                element['error'] = 'NO_FILEPATH';
                return element;
            }

            try {
                element.audioElement.duration = await getCachedVideoDuration(element.audioElement.filePath);
            } catch (error) {
                console.error('Error loading audio:', error);
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

        if (element.videoOriginalElement) {
            element.finishAt = (element.startAt || 0) + (element.videoOriginalElement.duration || 0);
        }
        else if (element.videoExtractElement) {
            element.finishAt = (element.startAt || 0) + (element.videoExtractElement.duration || 0);
        }
        else if (element.audioElement) {
            element.finishAt = (element.startAt || 0) + (element.audioElement.duration || 0);
        }
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