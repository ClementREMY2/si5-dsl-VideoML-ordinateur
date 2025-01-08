import {
    VideoProject,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    isVideoOriginal,
} from '../../language-server/generated/ast.js';
import { helperTimeToSeconds } from '../../lib/helper.js';
import { TimelineElementInfo } from './types.js';

export function generateTimelineElementInfos(videoProject: VideoProject): TimelineElementInfo[] {
    return videoProject.timelineElements.map(compileTimelineElement);
}

function compileTimelineElement(te: TimelineElement): TimelineElementInfo {
    if (!te.element.ref) throw new Error('Element reference is missing');

    const info: TimelineElementInfo = {
        name: te.name,
        videoElement: {
            name: te.element.ref.name,
            filePath: isVideoOriginal(te.element.ref) ? te.element.ref.filePath : undefined,
            // duration: ??? // TODO : fill if it's an extract
        },
        layer: te.layer || 0,
        ...(isRelativeTimelineElement(te) ? compileRelativeTimelineElement(te) : {}),
        ...(isFixedTimelineElement(te) ? compileFixedTimelineElement(te) : {}),
    };

    return info;
}

function compileRelativeTimelineElement(rte: RelativeTimelineElement): Partial<TimelineElementInfo> {
    if (!rte.relativeTo.ref) throw new Error('Relative to reference is missing');

    let offset: number = 0;
    if (rte.offset) {
        const timeSeconds = helperTimeToSeconds(rte.offset.slice(1));
        const operator = rte.offset[0];
        if (operator === '-') {
            offset = -timeSeconds;
        } else if (operator === '+') {
            offset = timeSeconds;
        }
    }

    return {
        relativePlacement: {
            offset,
            place: isStartRelativeTimelineElement(rte) ? 'START' : 'END',
            relativeTo: rte.relativeTo.ref?.name,
        }
    }
}

function compileFixedTimelineElement(fte: FixedTimelineElement): Partial<TimelineElementInfo> {
    return {
        startAt: helperTimeToSeconds(fte.startAt)
    }
}
