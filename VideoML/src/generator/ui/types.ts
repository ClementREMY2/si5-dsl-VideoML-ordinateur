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
    textElement?: { // TODO: remove useless properties
        name: string;
        text: string;
        duration?: number;
        font?: string;
        fontSize?: number;
        color?: string;
        position?: {
            x: number;
            y: number;
        }
        isSubtitle: boolean;
    }
    relativePlacement?: {
        offset: number;
        relativeTo: string; // TimelineElementInfo (timelineName)
        place: 'START' | 'END';
    }
}
