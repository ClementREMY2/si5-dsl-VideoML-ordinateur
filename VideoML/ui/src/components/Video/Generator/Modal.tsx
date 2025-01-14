import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Line } from "rc-progress";
import { useCallback } from "react";
import { FaCheckCircle } from "react-icons/fa";

import { VideoGenerationStatus, VideoGenerationProgress } from "./Context/Context";

type GenerationProgressProps = {
    itemsName: string,
    generationProgress: VideoGenerationProgress,
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({ generationProgress, itemsName }) => (
    <>
        <Line
            percent={generationProgress?.progress || 0}
            strokeWidth={4}
            strokeColor="#569CD6"
            trailWidth={4}
            trailColor="#D9D9D9"
        />
        <div className="mb-2">
            {generationProgress.processedFrames}/{generationProgress.totalFrames} {itemsName} processed
        </div>
        <div>
            Elapsed time: {generationProgress?.elapsedTime || '00:00'}
        </div>
        <div>
            Remaining time: {generationProgress?.etaTime || 'Calculating...'}
        </div>
    </>
)

type VideoGeneratorModalProps = {
    generationStatus?: VideoGenerationStatus;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({
    generationStatus,
}) => {
    const handleCancelGeneration = useCallback(() => {
        window.ipcRenderer.invoke('cancel-video-generation');
    }, []);

    return (
        <Modal
            isOpen
            backdrop="static"
        >
            <ModalHeader>Video generation in progress...</ModalHeader>
            <ModalBody>
                {!generationStatus?.chunk && !generationStatus?.frameIndex && (
                    <span>Video generation starting, please wait... (this may take a while, it need to install some dependencies)</span>
                )}
                {generationStatus?.chunk && (
                    generationStatus?.frameIndex
                        ? (<div className="mb-1"><FaCheckCircle className="text-success" /> Chunks generated</div>)
                        : (<GenerationProgress generationProgress={generationStatus.chunk} itemsName="chunks" />)
                )}
                {generationStatus?.frameIndex && (
                    <GenerationProgress generationProgress={generationStatus.frameIndex} itemsName="frames" />
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={handleCancelGeneration}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    )
}; 