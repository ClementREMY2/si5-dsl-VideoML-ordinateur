import { useTimeline } from "../Context/Context";

type TimelineLayoutLayerProps = {
    children: React.ReactNode;
    startTime: number;
    endTime: number;
};

export const TimelineLayoutLayer: React.FC<TimelineLayoutLayerProps> = ({ startTime, endTime, children }) => {
    const { timelineScaleFactor } = useTimeline();
    return (
        <div
            className="position-relative bg-white mb-1"
            style={{
                height: '50px',
                width: `${(endTime - startTime) * timelineScaleFactor}px`,
            }}
        >
            {children}
        </div>
    );
};