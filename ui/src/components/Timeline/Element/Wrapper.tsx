import { useTimeline } from "../Context/Context";
import { TimelineElementInfoFormatted } from "../helper";

type TimelineElementWrapperProps = {
    children: React.ReactNode;
    element: TimelineElementInfoFormatted;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
};

export const TimelineElementWrapper: React.FC<TimelineElementWrapperProps> = ({ children, element, color = 'primary' }) => {
    const { timelineScaleFactor } = useTimeline();
    return (
        <div
            key={element.id}
            className={`position-absolute h-100 bg-${color} text-white text-center rounded cursor-pointer overflow-hidden text-truncate`}
            style={{
                left: `${element.startTime * timelineScaleFactor}px`,
                width: `${(element.endTime - element.startTime) * timelineScaleFactor}px`,
                lineHeight: '50px',
            }}
            >
            {children}
        </div>
    );
};