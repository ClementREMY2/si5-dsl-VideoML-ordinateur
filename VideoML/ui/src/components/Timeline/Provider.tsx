import React, { useState, ReactNode, useMemo } from 'react';
import { TimelineContext, FileWithMetadata } from './Context';
import { TimelineElementInfo } from '../../lib/generated/generator/types';

interface TimelineProviderProps {
    children: ReactNode;
}
  
export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
const [timelineElementInfos, setTimelineElementInfos] = useState<TimelineElementInfo[]>([]);
const [loadedFiles, setLoadedFiles] = useState<FileWithMetadata[]>([]);

const value = useMemo(() => ({
    timelineElementInfos,
    setTimelineElementInfos,
    loadedFiles,
    setLoadedFiles,
}), [
    timelineElementInfos,
    loadedFiles,
]);

return (
    <TimelineContext.Provider value={value}>
    {children}
    </TimelineContext.Provider>
);
};