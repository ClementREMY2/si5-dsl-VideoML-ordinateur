import { useCallback } from "react"
import { Button, Spinner } from "reactstrap"
import { useVideoGenerator } from "../../Video/Generator/Context/Context"

type VideoGeneratorButtonProps = {
    className?: string
    onGenerated?: () => void
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({ className, onGenerated }) => {
    const { handleGenerateVideo, isGenerating } = useVideoGenerator();
    
    const handleClick = useCallback(async () => {
        await handleGenerateVideo();
        if (onGenerated) onGenerated();
    }, [onGenerated, handleGenerateVideo]);

    return (
        <Button
            color="primary text-white"
            onClick={handleClick}
            className={className}
            disabled={isGenerating}
        >
            {isGenerating && <Spinner className="me-2" size="sm" />}
            Generate
        </Button>
    )
}