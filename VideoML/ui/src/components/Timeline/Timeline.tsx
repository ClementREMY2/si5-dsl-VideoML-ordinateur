import { useMemo } from 'react';
import { Spinner } from 'reactstrap';

import { useTimeline } from './Context/Context';
import { TimelineElementInfoFormatted } from './helper';
import { TimelineLayoutTimecodes } from './Layout/Timecodes';
import { TimelineLayoutLayerIndicator } from './Layout/LayerIndicator';
import { TimelineElement } from './Element/Element';
import { TimelineLayoutLayer } from './Layout/Layer';

type TimelineLayers = {
  [layer: string]: TimelineElementInfoFormatted[];
}

export const Timeline: React.FC = () => {
  const { timelineElementInfos, isTimelineLoaded } = useTimeline();

  // Group elements by layers

  const layers = useMemo(
    () => timelineElementInfos
      .reduce((acc, element) => {
        const timelineElement: TimelineElementInfoFormatted = {
          id: element.name,
          startTime: element.startAt || 0,
          endTime: element.finishAt || 0,
          layer: element.layer,
          title: element.videoOriginalElement?.name  || element.videoExtractElement?.name || element.audioOriginalElement?.name || element.audioExtractElement?.name ||  element.textElement?.name || 'unknown',
          type: element.videoExtractElement ? 'VideoExtract' : element.videoOriginalElement ? 'VideoOriginal' : element.audioOriginalElement ? 'AudioOriginal' : element.audioExtractElement ? 'AudioExtract' : element.textElement ? (element.textElement.isSubtitle ? 'Subtitle' : 'Text') : 'unknown',
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

  return (
    <div className="h-100 w-100 overflow-scroll py-3" style={{ paddingLeft: '30px' }}>
      <div className="d-flex flex-column w-100 position-relative mb-3">
        {!isTimelineLoaded && (
          <div><Spinner className="me-2" size="sm" />Loading timeline...</div>
        )}
        {Object.entries(layers)
          .sort(([layerA], [layerB]) => parseInt(layerB) - parseInt(layerA))
          .map(([layer, elements]) => (
            <TimelineLayoutLayer key={layer} startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime}>
              <TimelineLayoutLayerIndicator layer={parseInt(layer)} startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime} />
              {elements.map((element) => <TimelineElement key={element.id} element={element} />)}
            </TimelineLayoutLayer>
          ))}
        <TimelineLayoutTimecodes startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime} />
      </div>
    </div>
  );
};