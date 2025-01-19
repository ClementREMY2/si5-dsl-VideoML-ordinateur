import { createContext, useContext } from 'react';

export type VideoGenerationStatus = {
  chunk?: VideoGenerationProgress,
  frameIndex?: VideoGenerationProgress,
};

export type VideoGenerationProgress = {
  progress: number,
  processedFrames: number,
  totalFrames: number,
  elapsedTime: string,
  etaTime: string,
  itPerSecond: number,
  isChunk?: boolean,
  isFrameIndex?: boolean,
};

interface VideoGeneratorContextProps {
    generationStatus: VideoGenerationStatus | undefined,
    handleGenerateVideo: () => Promise<void>,
    videoGeneratedPath: string | undefined,
    isGenerating: boolean,
    errorTraceback: string | undefined,
    manualInstallationInstructions: string | undefined,
}

export const VideoGeneratorContext = createContext<VideoGeneratorContextProps | undefined>(undefined);

export const useVideoGenerator = (): VideoGeneratorContextProps => {
  const context = useContext(VideoGeneratorContext);
  if (context === undefined) {
    throw new Error('useVideoGenerator must be used within a VideoGeneratorProvider');
  }
  return context;
};