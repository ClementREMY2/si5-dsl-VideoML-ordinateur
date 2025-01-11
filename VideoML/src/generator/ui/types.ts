export interface TimelineElementInfo {
    name: string;
    startAt?: number;
    layer: number;
    videoExtractElement?: {
        name: string;
        duration?: number;
        source?: string;
    }
    videoOriginalElement?: {
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
