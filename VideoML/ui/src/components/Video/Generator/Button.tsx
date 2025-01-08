import { useCallback } from "react"
import { Button } from "reactstrap"
import { useVideoGenerator } from "../../Video/Generator/Context/Context"

type VideoGeneratorButtonProps = {
    className?: string
    onGenerated?: () => void
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({ className, onGenerated }) => {
    const { handleGenerateVideo } = useVideoGenerator();
    
    const handleClick = useCallback(async () => {
        await handleGenerateVideo();
        if (onGenerated) onGenerated();
    }, [onGenerated, handleGenerateVideo]);

    return (
        <Button
            color="primary"
            onClick={handleClick}
            className={className}
        >
            Generate
        </Button>
    )
}