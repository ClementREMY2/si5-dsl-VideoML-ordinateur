import { TimelineElementInfoFormatted, TIMELINE_SCALE_FACTOR } from "../helper";

type TimelineElementWrapperProps = {
    children: React.ReactNode;
    element: TimelineElementInfoFormatted;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
};

export const TimelineElementWrapper: React.FC<TimelineElementWrapperProps> = ({ children, element, color = 'primary' }) => (
    <div
        key={element.id}
        className={`position-absolute h-100 bg-${color} text-white text-center rounded cursor-pointer overflow-hidden`}
        style={{
            left: `${element.startTime * TIMELINE_SCALE_FACTOR}px`,
            width: `${(element.endTime - element.startTime) * TIMELINE_SCALE_FACTOR}px`,
            lineHeight: '50px',
        }}
        >
        {children}
    </div>
)