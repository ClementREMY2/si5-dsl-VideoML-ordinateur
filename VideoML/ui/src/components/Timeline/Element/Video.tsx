import { formatTime, TimelineElementInfoFormatted } from "../helper";
import { TimelineElementWrapper } from "./Wrapper";

type TimelineElementVideoProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElementVideo: React.FC<TimelineElementVideoProps> = ({ element }) => (
    <TimelineElementWrapper element={element}>
        {element.id} - {element.title} ({formatTime(element.endTime - element.startTime)})
    </TimelineElementWrapper>
)