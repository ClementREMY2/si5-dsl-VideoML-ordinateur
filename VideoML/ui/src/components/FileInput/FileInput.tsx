import {useDropzone} from 'react-dropzone';

import './FileInput.css';

type FileInputProps = {
    className?: string;
    style?: React.CSSProperties;
    onDrop: (acceptedFiles: File[]) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ className, style, onDrop }) => {
    const {
        getRootProps,
        getInputProps,
    } = useDropzone({
      accept: {
        'video/*': ['.mp4', '.webm', '.ogg'],
      },
      onDrop,
      noDrag: true, // Can't use drag because we will not have the file path
    });
  
    return (
      <section className={className} style={style}>
        <div {...getRootProps({className: 'dropzone'})} className="dropzone-custom">
          <input {...getInputProps()} />
          <div>Click to select videos</div>
        </div>
      </section>
    );
  }