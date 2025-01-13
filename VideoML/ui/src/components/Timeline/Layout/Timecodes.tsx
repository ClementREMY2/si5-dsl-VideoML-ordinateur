import clsx from 'clsx';

import { formatTime } from '../helper';
import { useTimeline } from '../Context/Context';

import './Timecodes.css';

type TimelineTimecodesProps = {
    startTime: number;
    endTime: number;
};

export const TimelineLayoutTimecodes: React.FC<TimelineTimecodesProps> = ({
    startTime,
    endTime,
}) => {
    const length = ((endTime - startTime) / 10) + 1;
    const { timelineScaleFactor } = useTimeline();
    return (
        <div className="d-flex justify-content-between position-relative position-absolute bottom-0 h-100">
            {Array.from({ length }).map((_, i) => (
                <div
                key={i}
                className={clsx(
                    'position-absolute h-100 position-relative',
                    { 'border-transparent-black': i !== 0 && i !== length - 1 },
                )}
                style={{
                    left: `${i * 10 *  timelineScaleFactor}px`,
                }}
                >
                <div className="position-absolute" style={{ bottom: '-20px', left: '-20px' }}>{formatTime(i * 10)}</div>
                </div>
            ))}
        </div>
    );
};
