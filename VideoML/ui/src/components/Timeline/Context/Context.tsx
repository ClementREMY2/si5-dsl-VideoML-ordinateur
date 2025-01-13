import { createContext, useContext } from 'react';

import { TimelineElementInfo } from '../../../../lib/generated/generator/types';

export type PopulatedTimelineElementInfo = TimelineElementInfo & {
  error?: 'NO_FILEPATH' | 'LOAD_VIDEO';
  finishAt?: number;
};

interface TimelineContextProps {
    isVideoMLProgramValid: boolean;
    setIsVideoMLProgramValid: (value: boolean) => void;
    timelineElementInfos: PopulatedTimelineElementInfo[];
    handleNewTimelineElementInfos: (timelineElementInfos: TimelineElementInfo[]) => void;
    isTimelineLoaded: boolean;
}

export const TimelineContext = createContext<TimelineContextProps | undefined>(undefined);

export const useTimeline = (): TimelineContextProps => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};