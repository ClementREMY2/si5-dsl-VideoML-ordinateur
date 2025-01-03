import {
    VideoProject,
    isVideo,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
} from '../../language-server/generated/ast.js';
import { TimelineElementInfo, RelativeTimelineElementInfo, FixedTimelineElementInfo } from './types.js';

function helperTimeToSeconds(time: string): number {
    const timeArray = time.split(':');
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
}

export function generateTimelineElementInfos(videoProject: VideoProject): TimelineElementInfo[] {
    return videoProject.timelineElements.map(compileTimelineElement);
}

function compileTimelineElement(te: TimelineElement): TimelineElementInfo {
    if (!te.element.ref) throw new Error('Element reference is missing');

    const info = {
        name: te.name,
        element: {
            name: te.element.ref.name,
            filePath: isVideo(te.element.ref) ? te.element.ref.filePath : undefined
        },
        layer: te.layer
    };

    if (isRelativeTimelineElement(te)) {
        return compileRelativeTimelineElement(te, info);
    } else if (isFixedTimelineElement(te)) {
        return compileFixedTimelineElement(te, info);
    }

    throw new Error('Unknown timeline element type');
}

function compileRelativeTimelineElement(rte: RelativeTimelineElement, info: TimelineElementInfo): RelativeTimelineElementInfo {
    if (!rte.relativeTo.ref) throw new Error('Relative to reference is missing');

    let offset: number = 0;
    if (rte.offset) {
        const timeSeconds = helperTimeToSeconds(rte.offset.slice(1));
        const operator = rte.offset[0];
        offset = parseInt(`${operator} ${timeSeconds}`);
    }

    return {
        ...info,
        offset,
        place: isStartRelativeTimelineElement(rte) ? 'START' : 'END',
        relativeTo: rte.relativeTo.ref?.name,
    }
}

function compileFixedTimelineElement(fte: FixedTimelineElement, info: TimelineElementInfo): FixedTimelineElementInfo {
    return {
        ...info,
        startAt: helperTimeToSeconds(fte.startAt)
    }
}
