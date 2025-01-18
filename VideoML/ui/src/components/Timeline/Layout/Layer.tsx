import { useTimeline } from "../Context/Context";

import './Layer.scss';

type TimelineLayoutLayerProps = {
    children: React.ReactNode;
    startTime: number;
    endTime: number;
};

export const TimelineLayoutLayer: React.FC<TimelineLayoutLayerProps> = ({ startTime, endTime, children }) => {
    const { timelineScaleFactor } = useTimeline();
    return (
        <div
            className="position-relative mb-1 bg-lightgrey"
            style={{
                height: '50px',
                width: `${(endTime - startTime) * timelineScaleFactor}px`,
            }}
        >
            {children}
        </div>
    );
};