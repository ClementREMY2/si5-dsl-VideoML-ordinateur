import {
    VideoProject,
    isVideo,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    isText,
    isSubtitle,
} from '../../language-server/generated/ast.js';
import { TimelineElementInfo } from './types.js';

function helperTimeToSeconds(time: string): number {
    const timeArray = time.split(':');
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
}

export function generateTimelineElementInfos(videoProject: VideoProject): TimelineElementInfo[] {
    return videoProject.timelineElements.map(compileTimelineElement);
}

function compileTimelineElement(te: TimelineElement): TimelineElementInfo {
    if (!te.element.ref) throw new Error('Element reference is missing');

    const info: TimelineElementInfo = {
        name: te.name,
        ...(isVideo(te.element.ref) ? {
            videoElement: {
                name: te.element.ref.name,
                filePath: te.element.ref.filePath,
                // duration: ??? // TODO : fill if it's an extract
            }
        } : {}),
        ...(isText(te.element.ref) || isSubtitle(te.element.ref) ? {
            textElement: {
                name: te.element.ref.name,
                text: te.element.ref.text,
                duration: te.duration ? helperTimeToSeconds(te.duration) : 5,
                isSubtitle: isSubtitle(te.element.ref)
            }
        } : {}),
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
