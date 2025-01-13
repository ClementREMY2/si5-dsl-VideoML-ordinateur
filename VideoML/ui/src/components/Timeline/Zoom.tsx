import { useTimeline } from "./Context/Context";
import Slider from 'rc-slider';

import 'rc-slider/assets/index.css';

export const TimelineZoom: React.FC = () => {
    const { timelineZoom, setTimelineZoom } = useTimeline();

    return (
        <div className="px-3 py-2 d-flex flew-row align-items-center">
            Timeline zoom
            <Slider
                className="mx-3"
                style={{ width: 300}}
                min={10}
                max={100}
                value={timelineZoom}
                onChange={(number) => Array.isArray(number) ? setTimelineZoom(number[0]) : setTimelineZoom(number)}
            />
            {timelineZoom}%
        </div>
    );
};