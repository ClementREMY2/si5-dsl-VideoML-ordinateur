import { TimelineElementInfoFormatted } from "../helper";
import { TimelineElementVideo } from "./Video";

type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element }) => {
    switch (element.type) {
        case 'video':
            return <TimelineElementVideo element={element} />;
        default:
            return null;
    }
}