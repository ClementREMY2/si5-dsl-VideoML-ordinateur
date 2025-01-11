import { TimelineElementInfoFormatted } from "../helper";
import { TimelineElementVideoOriginal } from "./VideoOriginal";
import { TimelineElementVideoExtract } from "./VideoExtract";


type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element }) => {
    switch (element.type) {
        case 'VideoOriginal':
            return <TimelineElementVideoOriginal element={element} />;
        case 'VideoExtract':
            return <TimelineElementVideoExtract element={element} />;
        default:
            return null;
    }
}