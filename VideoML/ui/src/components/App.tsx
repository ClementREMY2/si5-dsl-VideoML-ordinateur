import { Editor } from './Editor/Editor'
import { TimelineProvider } from './Timeline/Context/Provider';
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
        <div style={{ height: '50vh' }} className="overflow-auto">
            <Timeline />
        </div>
        <div style={{ height: '50vh' }} className="p-3">
          <Editor className="h-100" mc={monacoWorkerPath} vml={videomlWorkerPath} />
        </div>
      </div>
    </TimelineProvider>
  )
}

export default App
