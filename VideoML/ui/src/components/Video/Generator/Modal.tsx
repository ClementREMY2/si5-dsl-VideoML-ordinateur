import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from "reactstrap";
import { Line } from "rc-progress";

import { VideoGenerationProgress } from "./Context/Context";
import { useCallback } from "react";

type VideoGeneratorModalProps = {
    generationProgress?: VideoGenerationProgress;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({
    generationProgress,
}) => {
    const handleCancelGeneration = useCallback(() => {
        window.ipcRenderer.invoke('cancel-video-generation');
    }, []);

    return (
        <Modal
            isOpen
            toggle={() => console.log('clic clic pan pan pan')}
            backdrop="static"
        >
            <ModalHeader>Video generation in progress...</ModalHeader>
            <ModalBody>
                <Line
                    percent={generationProgress?.progress || 0}
                    strokeWidth={4}
                    strokeColor="#3FC7FA"
                    trailWidth={4}
                    trailColor="#D9D9D9"
                />
                <div className="mb-2">
                    {generationProgress
                        ? <span>{generationProgress.processedFrames}/{generationProgress.totalFrames} frames processed</span>
                        : 'Video generation starting...'}
                </div>
                <div>
                    Elapsed time: {generationProgress?.elapsedTime || '00:00'}
                </div>
                <div>
                    Remaining time: {generationProgress?.etaTime || 'Calculating...'}
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={handleCancelGeneration}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    )
}; 