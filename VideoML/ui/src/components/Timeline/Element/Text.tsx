import { formatTime, TimelineElementInfoFormatted } from "../helper";
import { TimelineElementWrapper } from "./Wrapper";

type TimelineElementTextProps = {
    element: TimelineElementInfoFormatted;
    color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
};

export const TimelineElementText: React.FC<TimelineElementTextProps> = ({ element, color }) => (
    <TimelineElementWrapper element={element} color={color}>
        {`${element.id} - ${element.title} (${formatTime(element.endTime - element.startTime)})`}
    </TimelineElementWrapper>
)

