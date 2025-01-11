import { TimelineElementInfoFormatted } from "../helper";
import { TimelineElementVideoOriginal } from "./VideoOriginal";
import { TimelineElementVideoExtract } from "./VideoExtract";
import { TimelineElementAudioOriginal } from "./AudioOriginal";
import { TimelineElementAudioExtract } from "./AudioExtract";

type TimelineElementProps = {
    element: TimelineElementInfoFormatted;
};

export const TimelineElement: React.FC<TimelineElementProps> = ({ element }) => {
    switch (element.type) {
        case 'VideoOriginal':
            return <TimelineElementVideoOriginal element={element} />;
        case 'VideoExtract':
            return <TimelineElementVideoExtract element={element} />;
        case 'AudioOriginal':
            return <TimelineElementAudioOriginal element={element} />;
        case 'AudioExtract':
            return <TimelineElementAudioExtract element={element} />;
        default:
            return null;
    }
}