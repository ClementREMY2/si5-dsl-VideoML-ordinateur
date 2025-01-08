import {
    // Button,
    Modal,
    ModalBody,
    // ModalFooter,
    ModalHeader,
} from "reactstrap";
import { Line } from "rc-progress";

import { VideoGenerationProgress } from "./Context/Context";

type VideoGeneratorModalProps = {
    generationProgress?: VideoGenerationProgress;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({
    generationProgress,
}) => {
    return (
        <Modal
            isOpen
            toggle={() => console.log('clic clic pan pan pan')}
            backdrop="static"
        >
            <ModalHeader>Video generation in progres...</ModalHeader>
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
            {/* <ModalFooter>
                <Button color="secondary" onClick={() => console.log('clic clic pan pan pan')}>
                    Cancel
                </Button>
            </ModalFooter> */}
        </Modal>
    )
}; 