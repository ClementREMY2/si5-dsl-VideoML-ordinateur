export interface TimelineElementInfo {
    name: string;
    element: {
        name: string;
        filePath?: string;
    }
    extractDuration?: number; // TODO : to finish when VideoExtract are implemented
    layer: number;
}

export interface RelativeTimelineElementInfo extends TimelineElementInfo {
    offset: number;
    place: 'START' | 'END';
    relativeTo: string; // TimelineElementInfo (timelineName)
}

export interface FixedTimelineElementInfo extends TimelineElementInfo {
    startAt: number;
}