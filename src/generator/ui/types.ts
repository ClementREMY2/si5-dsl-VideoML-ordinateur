export interface TimelineElementInfo {
    name: string;
    startAt?: number;
    startAfterPrevious?: boolean;
    layer: number;
    duration?: number;
    audioOriginalElement?: {
        name: string;
        filePath: string;
    }
    audioExtractElement?: {
        name: string;
        source?: string;
    }
    videoOriginalElement?: {
        name: string;
        filePath?: string;
    }
    videoExtractElement?: {
        name: string;
        source?: string;
    }
    textElement?: { 
        name: string;
        isSubtitle: boolean;
    }
    relativePlacement?: {
        offset: number;
        relativeTo: string; // TimelineElementInfo (timelineName)
        place: 'START' | 'END';
    }
}
