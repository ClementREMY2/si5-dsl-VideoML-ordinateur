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
    generationProgress: VideoGenerationProgress;
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
                    percent={generationProgress.progress}
                    strokeWidth={4}
                    strokeColor="#3FC7FA"
                    trailWidth={4}
                    trailColor="#D9D9D9"
                />
                <div className="mb-2">
                    {generationProgress.processedFrames}/{generationProgress.totalFrames} frames processed
                </div>
                <div>
                    Elapsed time: {generationProgress.elapsedTime}
                </div>
                <div>
                    Remaining time: {generationProgress.etaTime}
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