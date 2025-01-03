export interface TimelineElementInfo {
    name: string;
    startAt?: number;
    layer: number;
    videoElement?: {
        name: string;
        filePath?: string;
        duration?: number;
    }
    relativePlacement?: {
        offset: number;
        relativeTo: string; // TimelineElementInfo (timelineName)
        place: 'START' | 'END';
    }
}
