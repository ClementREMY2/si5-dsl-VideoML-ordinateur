import { Editor } from './Editor/Editor'
import { Container } from 'reactstrap';
import FileLoader from './FileLoader/FileLoader';
import { TimelineProvider } from './Timeline/Provider';
import { Timeline } from './Timeline/Timeline';
import { useEffect, useState } from 'react';

function App() {
  const [monacoWorkerPath, setMonacoWorkerPath] = useState<string | null>(null);
  const [videomlWorkerPath, setVideomlWorkerPath] = useState<string | null>(null);

  useEffect(() => {
    window.ipcRenderer.invoke('get-monaco-worker-path').then((path) => {
      setMonacoWorkerPath(path);
    });
  }, []);

  useEffect(() => {
    window.ipcRenderer.invoke('get-video-ml-worker-path').then((path) => {
      setVideomlWorkerPath(path);
    });
  }, []);

  return monacoWorkerPath && videomlWorkerPath && (
    <TimelineProvider>
      <div className="bg-dark d-flex flex-column mh-100">
        <div style={{ height: '50vh' }}>
          <Container>
            <Timeline />
          </Container>
        </div>
        <div className="d-flex flex-row" style={{ height: '50vh' }}>
          <FileLoader className="w-25" />
          <Editor className="h-100 w-75" mc={monacoWorkerPath} vml={videomlWorkerPath} />
        </div>
      </div>
    </TimelineProvider>
  )
}

export default App
