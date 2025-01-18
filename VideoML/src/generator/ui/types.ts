export interface TimelineElementInfo {
    name: string;
    startAt?: number;
    startAfterPrevious?: boolean;
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
    textElement?: { 
        name: string;
        duration?: number;
        isSubtitle: boolean;
    }
    relativePlacement?: {
        offset: number;
        relativeTo: string; // TimelineElementInfo (timelineName)
        place: 'START' | 'END';
    }
}
