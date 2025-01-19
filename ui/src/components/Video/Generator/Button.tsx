import { useCallback } from "react"
import { Button, Spinner } from "reactstrap"

import { useVideoGenerator } from "../../Video/Generator/Context/Context"
import { usePythonVisualizer } from "../../PythonVisualizer/Context/Context"
import { useTimeline } from "../../Timeline/Context/Context"
import { FaExternalLinkAlt } from "react-icons/fa"

type VideoGeneratorButtonProps = {
    onGenerated?: () => void
}

export const VideoGeneratorButton: React.FC<VideoGeneratorButtonProps> = ({ onGenerated }) => {
    const { handleGenerateVideo, isGenerating, videoGeneratedPath } = useVideoGenerator();
    const { isPythonCodeLoaded } = usePythonVisualizer();
    const { isVideoMLProgramValid } = useTimeline();
    
    const handleClickGenerate = useCallback(async () => {
        await handleGenerateVideo();
        if (onGenerated) onGenerated();
    }, [onGenerated, handleGenerateVideo]);

    const handleClickOpenVideo = useCallback(() => {
        window.ipcRenderer.invoke('show-file-in-folder', videoGeneratedPath);
    }, [videoGeneratedPath]);

    const isLoading = isGenerating || !isPythonCodeLoaded;
    const isError = !isVideoMLProgramValid;

    return (
        <div className="d-flex flex-row">
            <Button
                color={(isError && !isLoading) ? 'danger' : 'primary'}
                onClick={handleClickGenerate}
                className="text-white"
                disabled={isLoading || isError}
            >
                {isLoading && <Spinner className="me-2" size="sm" />}
                Generate
            </Button>
            {!isGenerating && videoGeneratedPath && (
            <Button
                color="success"
                onClick={handleClickOpenVideo}
                className="ms-2 text-white"
            >
                <FaExternalLinkAlt className="me-2" />
                Open video
            </Button>
            )}
        </div>
    )
}