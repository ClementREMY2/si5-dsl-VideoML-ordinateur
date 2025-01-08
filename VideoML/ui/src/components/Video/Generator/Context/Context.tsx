import { createContext, useContext } from 'react';

export type VideoGenerationProgress = {
  progress: number,
  processedFrames: number,
  totalFrames: number,
  elapsedTime: string,
  etaTime: string,
  itPerSecond: number,
};

interface VideoGeneratorContextProps {
    generationProgress: VideoGenerationProgress | undefined,
    handleGenerateVideo: () => Promise<void>,
    videoGeneratedPath: string | undefined,
    isGenerating: boolean,
    errorTraceback: string | undefined,
}

export const VideoGeneratorContext = createContext<VideoGeneratorContextProps | undefined>(undefined);

export const useVideoGenerator = (): VideoGeneratorContextProps => {
  const context = useContext(VideoGeneratorContext);
  if (context === undefined) {
    throw new Error('useVideoGenerator must be used within a VideoGeneratorProvider');
  }
  return context;
};