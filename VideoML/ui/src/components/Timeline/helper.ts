// From seconds to MM:SS format
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  const stringTime = time.toString();
  const millisecondsString = stringTime.includes('.') ? stringTime.split('.')[1] : undefined;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${millisecondsString ? '.' + millisecondsString : ''}`;
}

export interface TimelineElementInfoFormatted {
    id: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
    layer: number;
    title: string;
    type: 'VideoOriginal' | 'VideoExtract' | 'AudioOriginal' | 'AudioExtract' | 'Text' | 'Subtitle' | 'unknown';
  }