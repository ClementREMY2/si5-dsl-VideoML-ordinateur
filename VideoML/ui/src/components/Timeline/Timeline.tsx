import React from 'react';
import { useTimeline } from './Context';

type TimelineProps = {
    className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const { timelineElementInfos } = useTimeline();

  console.log('timelineElementInfos', {timelineElementInfos});

  return (
    <div className={className}>
      Timeline
    </div>
  );
};