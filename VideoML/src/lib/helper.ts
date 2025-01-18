import { TimelineElement } from "../language-server/generated/ast.js";

export function helperTimeToSeconds(time: string): number {
    const minuteSecondArray = time.split(':');
    const secondMillisecondArray = minuteSecondArray[1].split('.');

    const milliseconds = secondMillisecondArray[1] || '0';
    const completedMilliseconds = milliseconds.padEnd(3, '0');

    return (parseInt(minuteSecondArray[0]) * 60) + (parseInt(secondMillisecondArray[0])) + (parseInt(completedMilliseconds) / 1000);
}

export function getLayer(te: TimelineElement): number {
    if (!te.layerPosition) return 0;
    
    const diff = te.layerPosition.position === 'above' ? 1 : -1;
    const timelineElementRef = te.layerPosition.relativeTo.ref;
    if (!timelineElementRef) return diff;

    return diff + getLayer(timelineElementRef);
}

export function getTimelineElementTextualDuration(duration: string | undefined): string {
    return duration || '00:05';
}