import { TimelineElementInfoFormatted } from "../helper";
import { TimelineElementText } from "./Text";
import { TimelineElementVideo } from "./Video";

type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element }) => {
    switch (element.type) {
        case 'video':
            return <TimelineElementVideo element={element} />;
        case 'text':
            return <TimelineElementText element={element} color='secondary' />;
        case 'subtitle':
            return <TimelineElementText element={element} color='success' />;
        default:
            return null;
    }
}