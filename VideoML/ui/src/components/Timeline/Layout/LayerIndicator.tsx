import { useTimeline } from '../Context/Context';

import './LayerIndicator.css';

type TimelineLayerIndicatorProps = {
    layer: number;
    startTime: number;
    endTime: number;
};

export const TimelineLayoutLayerIndicator: React.FC<TimelineLayerIndicatorProps> = ({ layer, startTime, endTime }) => {
    const { timelineScaleFactor } = useTimeline();
    return (
        Array.from({ length: (endTime - startTime) / 10 }).map((_, i) => (
            <div
            key={i}
            className="position-absolute text-secondary-transparent"
            style={{
                left: `${i * 10 * timelineScaleFactor + 25}px`,
                top: '15px',
            }}
            >
            Layer {layer}
            </div>
        ))
    );
};
