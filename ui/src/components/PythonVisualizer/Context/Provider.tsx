import React, { useState, ReactNode, useMemo } from 'react';
import { PythonVisualizerContext } from './Context';

interface PythonVisualizerProviderProps {
    children: ReactNode;
}


export const PythonVisualizerProvider: React.FC<PythonVisualizerProviderProps> = ({ children }) => {
    const [pythonCode, setPythonCode] = useState<string>('');
    const [isPythonCodeLoaded, setIsPythonCodeLoaded] = useState(false);

    const value = useMemo(() => ({
        pythonCode,
        setPythonCode,
        isPythonCodeLoaded,
        setIsPythonCodeLoaded,
    }), [
        pythonCode,
        isPythonCodeLoaded,
    ]);

    return (
        <PythonVisualizerContext.Provider value={value}>
        {children}
        </PythonVisualizerContext.Provider>
    );
};