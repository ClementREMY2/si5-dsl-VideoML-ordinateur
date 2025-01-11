export const TIMELINE_SCALE_FACTOR = 10;

// From seconds to MM:SS format
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export interface TimelineElementInfoFormatted {
    id: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
    layer: number;
    title: string;
    type: 'VideoOriginal' | 'VideoExtract' | 'AudioOriginal' | 'AudioExtract' | 'unknown';
  }