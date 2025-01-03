import { useMemo } from 'react';

import { useTimeline } from './Context/Context';
import { formatTime, TIMELINE_SCALE_FACTOR } from './helper';
import { TimelineTimecodes } from './Timecodes';

export interface TimelineElement {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  layer: number;
  title: string;
}

type TimelineLayers = {
  [layer: string]: TimelineElement[];
}

export const Timeline: React.FC = () => {
  const { timelineElementInfos } = useTimeline();

  // Group elements by layers
  const layers = useMemo(
    () => timelineElementInfos
      .reduce((acc, element) => {
        const timelineElement = {
          id: element.name,
          startTime: element.startAt || 0,
          endTime: element.finishAt || 0,
          layer: element.layer,
          title: element.videoElement?.name || 'unknown',
        }

        if (acc[element.layer]) {
          acc[element.layer].push(timelineElement);
        } else {
          acc[element.layer] = [timelineElement];
        }

        return acc;
      }, ({} as TimelineLayers)),
      [timelineElementInfos],
    );

  const timelineBounds = useMemo(() => {
    const maxEndTime = Math.max(...timelineElementInfos.map((element) => element.finishAt || 0));
     // Round to the nearest 10 seconds
    const timelineEndTime = maxEndTime + (10 - (maxEndTime % 10));


    return { timelineStartTime: 0, timelineEndTime };
  }, [timelineElementInfos]);
  console.log(timelineBounds);

  return (
    <div className="h-100 w-100 overflow-scroll py-3" style={{ paddingLeft: '30px' }}>
      <div className="d-flex flex-column w-100 position-relative">
        {Object.entries(layers).map(([layer, elements]) => (
          <div
            key={layer}
            className="position-relative bg-white mb-1"
            style={{
              height: '50px',
              width: `${(timelineBounds.timelineEndTime - timelineBounds.timelineStartTime) * TIMELINE_SCALE_FACTOR}px`,
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className="position-absolute h-100 bg-primary text-white text-center border border-primary cursor-pointer"
                style={{
                  left: `${element.startTime * TIMELINE_SCALE_FACTOR}px`,
                  width: `${(element.endTime - element.startTime) * TIMELINE_SCALE_FACTOR}px`,
                  lineHeight: '50px',
                }}
              >
                {element.id} - {element.title} ({formatTime(element.endTime - element.startTime)})
              </div>
            ))}
          </div>
        ))}
        <TimelineTimecodes startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime} />
      </div>
    </div>
  );
};