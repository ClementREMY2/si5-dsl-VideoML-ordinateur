import { useEffect, useCallback, useRef, useState } from 'react';
import clsx from 'clsx';

import './FileInput.css';

type FileInputProps = {
    className?: string;
    style?: React.CSSProperties;
    onDrop: (acceptedFiles: File[]) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ className, style, onDrop }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  const [showReleaseFiles, setShowReleaseFiles] = useState(false);

  const handleDivClick = useCallback(() => {
      if (inputRef.current) {
          inputRef.current.click();
      }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          onDrop(Array.from(e.target.files));
      }
  }, [onDrop]);

  useEffect(() => {
    if (!dropZoneRef.current) return;

    const div = dropZoneRef.current;

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
  
      if (event.dataTransfer) {
        const videos = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith('video/'));
        if (videos.length > 0) {
            onDrop(videos);
            setShowReleaseFiles(false);
        }
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const handleDragEnter = () => {
      setShowReleaseFiles(true);
    };

    const handleDragLeave = () => {
      setShowReleaseFiles(false);
    };

    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('dragenter', handleDragEnter);
    div.addEventListener('dragleave', handleDragLeave);

    return () => {
      div.removeEventListener('drop', handleDrop);
      div.removeEventListener('dragover', handleDragOver);
      div.removeEventListener('dragenter', handleDragEnter);
      div.removeEventListener('dragleave', handleDragLeave);
    }
  }, [onDrop]); 

  return (
    <section
      className={clsx('dropzone-parent', className)}
      ref={dropZoneRef}
      style={{ ...style, width: '320px' }}
      onClick={handleDivClick}
    >
      <div
        className={clsx(
          "dropzone-custom",
          showReleaseFiles && "dropzone-custom-release"
        )}
      >
        <input
            type="file"
            accept="video/*"
            ref={inputRef}
            onChange={handleFileChange}
            className="d-none"
        />
        {showReleaseFiles
          ? <div>Release files to add</div>
          : <div>Drop your videos here or click to select</div>}
      </div>
    </section>
  );
}