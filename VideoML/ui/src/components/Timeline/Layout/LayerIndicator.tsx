import { TIMELINE_SCALE_FACTOR } from '../helper';

import './LayerIndicator.css';

type TimelineLayerIndicatorProps = {
    layer: number;
    startTime: number;
    endTime: number;
};

export const TimelineLayoutLayerIndicator: React.FC<TimelineLayerIndicatorProps> = ({ layer, startTime, endTime }) => (
    Array.from({ length: (endTime - startTime) / 10 }).map((_, i) => (
        <div
        key={i}
        className="position-absolute text-secondary-transparent"
        style={{
            left: `${i * 10 * TIMELINE_SCALE_FACTOR + 25}px`,
            top: '15px',
        }}
        >
        Layer {layer}
        </div>
    ))
);
