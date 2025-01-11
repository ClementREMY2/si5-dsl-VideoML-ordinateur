export interface TimelineElementInfo {
    name: string;
    startAt?: number;
    layer: number;
    audioOriginalElement?: {
        name: string;
        filePath: string;
        duration?: number;
    }
    audioExtractElement?: {
        name: string;
        duration?: number;
        source?: string;
    }
    videoOriginalElement?: {
        name: string;
        filePath?: string;
        duration?: number;
    }
    videoExtractElement?: {
        name: string;
        duration?: number;
        source?: string;
    }
    relativePlacement?: {
        offset: number;
        relativeTo: string; // TimelineElementInfo (timelineName)
        place: 'START' | 'END';
    }
}
