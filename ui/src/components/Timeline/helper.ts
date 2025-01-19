// From seconds to MM:SS format
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  const stringTime = time.toString();
  let millisecondsString = stringTime.includes('.') ? stringTime.split('.')[1] : undefined;

  // Prevent showing more than 3 digits for milliseconds (can happen due to floating point precision)
  if (millisecondsString && millisecondsString.length > 3) {
    millisecondsString = undefined;
  }

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