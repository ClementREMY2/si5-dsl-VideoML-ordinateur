import { useCallback } from "react"
import { Button, Spinner } from "reactstrap"
import { useVideoGenerator } from "../../Video/Generator/Context/Context"
import { usePythonVisualizer } from "../../PythonVisualizer/Context/Context"

type VideoGeneratorButtonProps = {
    className?: string
    onGenerated?: () => void
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({ className, onGenerated }) => {
    const { handleGenerateVideo, isGenerating } = useVideoGenerator();
    const { isPythonCodeLoaded } = usePythonVisualizer();
    
    const handleClick = useCallback(async () => {
        await handleGenerateVideo();
        if (onGenerated) onGenerated();
    }, [onGenerated, handleGenerateVideo]);

    const isLoading = isGenerating || !isPythonCodeLoaded;

    return (
        <Button
            color="primary text-white"
            onClick={handleClick}
            className={className}
            disabled={isLoading}
        >
            {isLoading && <Spinner className="me-2" size="sm" />}
            Generate
        </Button>
    )
}