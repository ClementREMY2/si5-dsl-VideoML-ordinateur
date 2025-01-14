import { useCallback } from "react"
import { Button, Spinner } from "reactstrap"
import clsx from "clsx"

import { useVideoGenerator } from "../../Video/Generator/Context/Context"
import { usePythonVisualizer } from "../../PythonVisualizer/Context/Context"
import { useTimeline } from "../../Timeline/Context/Context"

type VideoGeneratorButtonProps = {
    className?: string
    onGenerated?: () => void
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({ className, onGenerated }) => {
    const { handleGenerateVideo, isGenerating } = useVideoGenerator();
    const { isPythonCodeLoaded } = usePythonVisualizer();
    const { isVideoMLProgramValid } = useTimeline();
    
    const handleClick = useCallback(async () => {
        await handleGenerateVideo();
        if (onGenerated) onGenerated();
    }, [onGenerated, handleGenerateVideo]);

    const isLoading = isGenerating || !isPythonCodeLoaded;
    const isError = !isVideoMLProgramValid;

    return (
        <Button
            color={(isError && !isLoading) ? 'danger' : 'primary'}
            onClick={handleClick}
            className={clsx(className, 'text-white')}
            disabled={isLoading || isError}
        >
            {isLoading && <Spinner className="me-2" size="sm" />}
            Generate
        </Button>
    )
}