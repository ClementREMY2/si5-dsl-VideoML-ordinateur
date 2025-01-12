import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { TimelineContext, PopulatedTimelineElementInfo } from './Context';
import { TimelineElementInfo } from '../../../../lib/generated/generator/types';
import { getCachedVideoDuration } from '../../../lib/video-duration-getter';
import { getCachedAudioDuration } from '../../../lib/audio-duration-getter';

interface TimelineProviderProps {
    children: ReactNode;
}

const getStartAtRecursively = (element: PopulatedTimelineElementInfo, timelineElementInfos: PopulatedTimelineElementInfo[]): number => {
    if (!element.relativePlacement) return element.startAt || 0;

    const relativeToElement = timelineElementInfos.find((e) => e.name === element.relativePlacement?.relativeTo);
    if (!relativeToElement) return 0;

    const relativeStartAt = getStartAtRecursively(relativeToElement, timelineElementInfos);

    const offset = element.relativePlacement.offset || 0;
    const place = element.relativePlacement.place === 'END';

    if (element.videoOriginalElement) { 
        return relativeStartAt + offset + (place ? relativeToElement.videoOriginalElement?.duration || 0 : 0);
    }
    else if (element.videoExtractElement) {
        return relativeStartAt + offset + (place ? relativeToElement.videoExtractElement?.duration || 0 : 0);
    }
    else if (element.audioOriginalElement) {
        return relativeStartAt + offset + (place ? relativeToElement.audioOriginalElement?.duration || 0 : 0);
    }
    else if (element.audioExtractElement) {
        return relativeStartAt + offset + (place ? relativeToElement.audioExtractElement?.duration || 0 : 0);
    }
    else if (element.textElement) {
        return relativeStartAt + offset + (place ? relativeToElement.textElement?.duration || 0 : 0);
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
        else if (element.audioOriginalElement) {

            if (element.audioOriginalElement.duration) {
                return element;
            }

            if (!element['audioOriginalElement']['filePath']) {
                element['error'] = 'NO_FILEPATH';
                return element;
            }

            try {
                element.audioOriginalElement.duration = await getCachedAudioDuration(element.audioOriginalElement.filePath);
            } catch (error) {
                console.error('Error loading audio:', error);
                element.error = 'LOAD_VIDEO';
            }
        }


        return element;
    }));

    // Resolve startAt and finishAt time for each relative element
    const populatedElements = populatedDurationElements.reduce((acc, element, i) => {
        if (!element.error) {

            // Calculate startAt
            if (element.relativePlacement) {
                element.startAt = getStartAtRecursively(element, populatedDurationElements);
            } else if (element.startAfterPrevious) {
                const previousElement = acc[i - 1];
                element.startAt = (previousElement?.finishAt || 0);
            }

            // Calculate finishAt
            if (element.videoOriginalElement) {
                element.finishAt = (element.startAt || 0) + (element.videoOriginalElement.duration || 0);
            }
            else if (element.videoExtractElement) {
                element.finishAt = (element.startAt || 0) + (element.videoExtractElement.duration || 0);
            }
            else if (element.audioOriginalElement) {
                element.finishAt = (element.startAt || 0) + (element.audioOriginalElement.duration || 0);
            }
            else if (element.audioExtractElement) {
                element.finishAt = (element.startAt || 0) + (element.audioExtractElement.duration || 0);
            }
            else if (element.textElement) {
                element.finishAt = (element.startAt || 0) + (element.textElement.duration || 0);
            } 
        }

        acc.push(element);
        return acc;
    }, [] as PopulatedTimelineElementInfo[]);

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