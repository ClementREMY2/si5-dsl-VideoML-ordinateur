import { TimelineElementInfoFormatted } from "../helper";
import { TimelineElementVideoOriginal } from "./VideoOriginal";
import { TimelineElementVideoExtract } from "./VideoExtract";
import { TimelineElementAudio } from "./Audio";

type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element }) => {
    switch (element.type) {
        case 'VideoOriginal':
            return <TimelineElementVideoOriginal element={element} />;
        case 'VideoExtract':
            return <TimelineElementVideoExtract element={element} />;
        case 'Audio':
            return <TimelineElementAudio element={element} />;
        default:
            return null;
    }
}