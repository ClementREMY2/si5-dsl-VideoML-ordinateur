import { createContext, useContext } from 'react';

interface PythonVisualizerContextProps {
    pythonCode: string;
    setPythonCode: React.Dispatch<React.SetStateAction<string>>;
}

export const PythonVisualizerContext = createContext<PythonVisualizerContextProps | undefined>(undefined);

export const usePythonVisualizer = (): PythonVisualizerContextProps => {
  const context = useContext(PythonVisualizerContext);
  if (context === undefined) {
    throw new Error('usePythonVisualizer must be used within a PythonVisualizerProvider');
  }
  return context;
};