import { TIMELINE_SCALE_FACTOR } from "../helper";

type TimelineLayoutLayerProps = {
    children: React.ReactNode;
    startTime: number;
    endTime: number;
};

export const TimelineLayoutLayer: React.FC<TimelineLayoutLayerProps> = ({ startTime, endTime, children }) => (
    <div
        className="position-relative bg-white mb-1"
        style={{
            height: '50px',
            width: `${(endTime - startTime) * TIMELINE_SCALE_FACTOR}px`,
        }}
    >
        {children}
    </div>
)