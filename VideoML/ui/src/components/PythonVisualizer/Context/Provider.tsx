import React, { useState, ReactNode, useMemo } from 'react';
import { PythonVisualizerContext } from './Context';

interface PythonVisualizerProviderProps {
    children: ReactNode;
}


export const PythonVisualizerProvider: React.FC<PythonVisualizerProviderProps> = ({ children }) => {
    const [pythonCode, setPythonCode] = useState<string>('');

    const value = useMemo(() => ({
        pythonCode,
        setPythonCode,
    }), [
        pythonCode,
    ]);

    return (
        <PythonVisualizerContext.Provider value={value}>
        {children}
        </PythonVisualizerContext.Provider>
    );
};