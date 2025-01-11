import { formatTime, TimelineElementInfoFormatted } from "../helper";
import { TimelineElementWrapper } from "./Wrapper";

type TimelineElementAudioProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElementAudioOriginal: React.FC<TimelineElementAudioProps> = ({ element }) => (
    <TimelineElementWrapper element={element} color="secondary">
            {element.id} - {element.title} ({formatTime(element.endTime - element.startTime)})
    </TimelineElementWrapper>
);