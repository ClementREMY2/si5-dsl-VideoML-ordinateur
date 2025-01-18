import { TimelineElement } from "../language-server/generated/ast.js";

export function helperTimeToSeconds(time: string): number {
    const timeArray = time.split(':');
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
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