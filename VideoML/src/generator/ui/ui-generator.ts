import {
    VideoProject,
    isRelativeTimelineElement,
    RelativeTimelineElement,
    isStartRelativeTimelineElement,
    FixedTimelineElement,
    isFixedTimelineElement,
    TimelineElement,
    isVideoOriginal,
    isVideoExtract,
    isAudioOriginal,
    isAudioExtract,
} from '../../language-server/generated/ast.js';
import { helperTimeToSeconds } from '../../lib/helper.js';
import { TimelineElementInfo } from './types.js';

export function generateTimelineElementInfos(videoProject: VideoProject): TimelineElementInfo[] {
    return videoProject.timelineElements.map(compileTimelineElement);
}

function compileTimelineElement(te: TimelineElement): TimelineElementInfo {
    if (!te.element.ref) throw new Error('Element reference is missing');

    let info: TimelineElementInfo

    if (isVideoOriginal(te.element.ref)) {
        info = {
            name: te.name,
            videoOriginalElement: {
                name: te.element.ref.name,
                filePath: te.element.ref.filePath,
            },
            layer: te.layer || 0,
            ...(isRelativeTimelineElement(te) ? compileRelativeTimelineElement(te) : {}),
            ...(isFixedTimelineElement(te) ? compileFixedTimelineElement(te) : {}),
        };
    } else if (isVideoExtract(te.element.ref)) {
        info = {
            name: te.name,
            videoExtractElement: {
                name: te.element.ref.name,
                duration: helperTimeToSeconds(te.element.ref.end) - helperTimeToSeconds(te.element.ref.start),
                //source: te.element.ref.source (TODO: add source correctly, or delete it, as we are not using it atm.)
            },
            layer: te.layer || 0,
            ...(isRelativeTimelineElement(te) ? compileRelativeTimelineElement(te) : {}),
            ...(isFixedTimelineElement(te) ? compileFixedTimelineElement(te) : {}),
        };
    } else if (isAudioOriginal(te.element.ref)) {
        info = {
            name: te.name,
            audioOriginalElement: {
                name: te.element.ref.name,
                filePath: te.element.ref.filePath,
            },
            layer: te.layer || 0,
            ...(isRelativeTimelineElement(te) ? compileRelativeTimelineElement(te) : {}),
            ...(isFixedTimelineElement(te) ? compileFixedTimelineElement(te) : {}),
        };
    } else if (isAudioExtract(te.element.ref)) {
        info = {
            name: te.name,
            audioExtractElement: {
                name: te.element.ref.name,
                duration: helperTimeToSeconds(te.element.ref.end) - helperTimeToSeconds(te.element.ref.start),
                //source: te.element.ref.source (TODO: add source correctly, or delete it, as we are not using it atm.)
            },
            layer: te.layer || 0,
            ...(isRelativeTimelineElement(te) ? compileRelativeTimelineElement(te) : {}),
            ...(isFixedTimelineElement(te) ? compileFixedTimelineElement(te) : {}),
        };
    } else {
        throw new Error('Unknown element type');
    }


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
