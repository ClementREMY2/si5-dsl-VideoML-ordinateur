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
    const offset = element.relativePlacement.offset || 0;
    const place = element.relativePlacement.place;

    const relativeDuration = relativeToElement.videoOriginalElement?.duration ||
                             relativeToElement.videoExtractElement?.duration ||
                             relativeToElement.textElement?.duration || 0;

    const additionalTime = place === 'END' ? relativeDuration : 0;

    return relativeStartAt + offset + additionalTime;
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


        return element;
    }));

    // Resolve startAt and finishAt time for each relative element
    const populatedElements = populatedDurationElements.map((element) => {
        if (element.error) return element;

        
        if (element.relativePlacement) {
            element.startAt = getStartAtRecursively(element, populatedDurationElements);
        }
        
        element.finishAt = (element.startAt || 0) + (element.videoOriginalElement?.duration || element.videoExtractElement?.duration || element.textElement?.duration || 0);
        
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