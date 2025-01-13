import { formatTime, TimelineElementInfoFormatted } from "../helper";
import { TimelineElementWrapper } from "./Wrapper";



type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
    color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element, color }) => {
    switch (element.type) {
        case 'VideoOriginal':
            color = 'primary';
            break;
        case 'VideoExtract':
            color = 'info';
            break;
        case 'AudioOriginal':
            color = 'success';
            break;
        case 'AudioExtract':
            color = 'danger';
            break;
        case 'Text':
            color = 'warning';
            break;
        case 'Subtitle':
            color = 'secondary';
            break;
        default:
            return null;
    }
    return (
        <TimelineElementWrapper element={element} color={color}>
        {`${element.id} - ${element.title} (${formatTime(element.endTime - element.startTime)})`}
        </TimelineElementWrapper>
    );
}

