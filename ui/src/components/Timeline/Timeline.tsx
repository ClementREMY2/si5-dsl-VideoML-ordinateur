import { useMemo } from 'react';
import { Spinner } from 'reactstrap';

import { useTimeline } from './Context/Context';
import { TimelineElementInfoFormatted } from './helper';
import { TimelineLayoutTimecodes } from './Layout/Timecodes';
import { TimelineElement } from './Element/Element';
import { TimelineLayoutLayer } from './Layout/Layer';
import { TimelineLayoutLayerNames } from './Layout/LayerNames';

type TimelineLayers = {
  [layer: string]: TimelineElementInfoFormatted[];
}

export const Timeline: React.FC = () => {
  const { timelineElementInfos, isTimelineLoaded, timelineScaleFactor } = useTimeline();

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
      }, ({
        '-1': [],
        '0': [],
        '1': [],
      } as TimelineLayers)),
      [timelineElementInfos],
    );

  const timelineBounds = useMemo(() => {
    const maxEndTime = Math.max(...timelineElementInfos.map((element) => element.finishAt || 0), 0);

    const roundedTo10 = (num: number) => num + (10 - (num % 10));

     // Round to the nearest 10 seconds
    const timelineDurationRounded = roundedTo10(maxEndTime);

    const parentContainer = document.querySelector('#TimelineParent');
    const parentWidth = (parentContainer?.clientWidth || 0);

    const timelineEndTime = Math.max(timelineDurationRounded, roundedTo10(parentWidth / timelineScaleFactor) - 10);


    return { timelineStartTime: 0, timelineEndTime };
  }, [timelineElementInfos, timelineScaleFactor]);

  return (
    <div className="h-100 w-100">
      <div className="d-flex flex-row w-100">
        {isTimelineLoaded && (
            <div className="pe-2">
              <TimelineLayoutLayerNames layers={Object.keys(layers)} />
          </div>
        )}
        <div className="d-flex flex-column w-100 position-relative mb-3 overflow-auto ps-4">
          {!isTimelineLoaded && (
            <div><Spinner className="me-2" size="sm" />Loading timeline...</div>
          )}
          {isTimelineLoaded && Object.entries(layers)
            .sort(([layerA], [layerB]) => parseInt(layerB) - parseInt(layerA))
            .map(([layer, elements,]) => (
              <TimelineLayoutLayer key={layer} startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime}>
                {elements.map((element) => <TimelineElement key={element.id} element={element} color={'secondary'} />)}
              </TimelineLayoutLayer>
            ))}
          {isTimelineLoaded && <TimelineLayoutTimecodes startTime={timelineBounds.timelineStartTime} endTime={timelineBounds.timelineEndTime} />}
        </div>
      </div>
    </div>
  );
};