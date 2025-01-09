import { formatTime, TimelineElementInfoFormatted } from "../helper";
import { TimelineElementWrapper } from "./Wrapper";

type TimelineElementVideoProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElementVideoExtract: React.FC<TimelineElementVideoProps> = ({ element }) => (
    <TimelineElementWrapper element={element} color="success">
            {element.id} - {element.title} ({formatTime(element.endTime - element.startTime)})
    </TimelineElementWrapper>
);
