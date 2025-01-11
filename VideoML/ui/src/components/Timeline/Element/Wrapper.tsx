import { TimelineElementInfoFormatted, TIMELINE_SCALE_FACTOR } from "../helper";

type TimelineElementWrapperProps = {
    children: React.ReactNode;
    element: TimelineElementInfoFormatted;
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
};

export const TimelineElementWrapper: React.FC<TimelineElementWrapperProps> = ({ children, element, color = 'primary' }) => (
    <div
        key={element.id}
        className={`position-absolute h-100 bg-${color} text-white text-center rounded cursor-pointer`}
        style={{
            left: `${element.startTime * TIMELINE_SCALE_FACTOR}px`,
            width: `${(element.endTime - element.startTime) * TIMELINE_SCALE_FACTOR}px`,
            lineHeight: '50px',
        }}
        >
        {
            // TODO: to delete if Alexis is upset
            (element.endTime - element.startTime) < (children?.toString().length ?? 50) ? 
                (element.endTime - element.startTime) < String(children).split('(')[0].length ?
                    String(children).split(' ')[0].slice(0, element.endTime - element.startTime - 3) + '...' : String(children).split('(')[0]
                : children
        }
    </div>
)