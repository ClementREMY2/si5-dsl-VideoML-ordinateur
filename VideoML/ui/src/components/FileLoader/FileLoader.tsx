import React from 'react';
import { Button, ListGroup, ListGroupItem } from 'reactstrap';
import { FaTrashAlt } from 'react-icons/fa';

import { useTimeline, FileWithMetadata } from '../Timeline/Context';

type FileLoaderProps = {
    className?: string;
}

const FileLoader: React.FC<FileLoaderProps> = ({ className }) => {
  const { loadedFiles, setLoadedFiles } = useTimeline();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const newFiles = Array.from(event.target.files)
            .filter(file => file.type.startsWith('video/'))
            .map(file => {
                const fileWithMetadata: FileWithMetadata = file;
                const videoElement = document.createElement('video');
                videoElement.src = URL.createObjectURL(file);
                videoElement.onloadedmetadata = () => {
                    fileWithMetadata.duration = videoElement.duration;
                };
                return fileWithMetadata;
            });
            setLoadedFiles((prev) => [...prev, ...newFiles]);
    }

    // clear the input
    event.target.value = '';
  };

  const handleDeleteFile = (index: number) => {
    setLoadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <input type="file" multiple onChange={handleFileChange} accept="video/*" />
      <ListGroup>
        {loadedFiles.map((file, index) => (
          <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
            {file.name}
            <Button color="danger" size="sm" onClick={() => handleDeleteFile(index)}>
              <FaTrashAlt />
            </Button>
          </ListGroupItem>
        ))}
      </ListGroup>
    </div>
  );
};

export default FileLoader;