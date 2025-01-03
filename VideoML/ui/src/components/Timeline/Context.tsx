import React, { createContext, useContext } from 'react';

import { TimelineElementInfo } from '../../../lib/generated/generator/types';

interface TimelineContextProps {
    timelineElementInfos: TimelineElementInfo[];
    setTimelineElementInfos: React.Dispatch<React.SetStateAction<TimelineElementInfo[]>>;
    loadedFiles: FileWithMetadata[];
    setLoadedFiles: React.Dispatch<React.SetStateAction<FileWithMetadata[]>>;
}

export type FileWithMetadata = File & {
    duration?: number;
};

export const TimelineContext = createContext<TimelineContextProps | undefined>(undefined);

export const useTimeline = (): TimelineContextProps => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};