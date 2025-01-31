import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { useCallback, useEffect, useState } from 'react';

import { Editor } from '../Editor/Editor'
import { Timeline } from '../Timeline/Timeline';
import { PythonVisualizer } from '../PythonVisualizer/Visualizer';
import { FileInput } from '../FileInput/FileInput';
import { VideoPlayer } from '../Video/Player';
import { VideoGeneratorButton } from '../Video/Generator/Button';
import { TimelineZoom } from '../Timeline/Zoom';

export const Home: React.FC = () => {
  const [monacoWorkerPath, setMonacoWorkerPath] = useState<string | null>(null);
  const [videomlWorkerPath, setVideomlWorkerPath] = useState<string | null>(null);

  const [openedTab, setOpenedTab] = useState<'timeline' | 'python'| 'video'>('timeline');

  const [filesToInsert, setFilesToInsert] = useState<File[]>([]);
  
  const onFilesDrop = useCallback((acceptedFiles: File[]) => {
    setFilesToInsert(acceptedFiles);
  }, []);

  const onInsertCode = useCallback(() => {
    setFilesToInsert([]);
  }, []);

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

  const handleVideoGenerated = useCallback(() => {
    setOpenedTab('video');
  }, []);

  return monacoWorkerPath && videomlWorkerPath && (
    <div className="bg-dark d-flex flex-column mh-100">
    <div style={{ height: '50vh' }} className="d-flex flex-column p-3 overflow-hidden">
        <Nav tabs>
            <NavItem>
                <NavLink
                className={openedTab === 'timeline' ? 'active' : ''}
                onClick={() => setOpenedTab('timeline')}
                >
                Timeline
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                className={openedTab === 'python' ? 'active' : ''}
                onClick={() => setOpenedTab('python')}
                >
                Python
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                className={openedTab === 'video' ? 'active' : ''}
                onClick={() => setOpenedTab('video')}
                >
                Video
                </NavLink>
            </NavItem>
        </Nav>
        <div className="flex-grow-1 d-flex flex-column overflow-hidden">
          <TabContent activeTab={openedTab} className="overflow-hidden h-100">
              <TabPane tabId="timeline" className="h-100 overflow-auto" id="TimelineParent">
                  <Timeline />
              </TabPane>
              <TabPane tabId="python" className="h-100 overflow-auto">
                  <PythonVisualizer className="h-100" />
              </TabPane>
              <TabPane tabId="video" className="h-100">
                  <VideoPlayer className="h-100 w-100 overflow-hidden d-flex flex-column" />
              </TabPane>
          </TabContent>
          <TabContent activeTab={openedTab} className="overflow-hidden">
              <TabPane tabId="timeline" className="h-100">
                  <TimelineZoom />
              </TabPane>
          </TabContent>
        </div>
    </div>
    <div style={{ height: '50vh' }} className="overflow-auto d-flex flex-column py-3">
        <div className="d-flex flex-row align-items-center mb-2 mx-3 justify-content-between">
        <h3>Video ML Editor</h3>
        <FileInput
            className="mx-3 flex-grow-1"
            onDrop={onFilesDrop}
            style={{
                minWidth: '320px',
            }}
        />
        <VideoGeneratorButton onGenerated={handleVideoGenerated} />
        </div>
        <Editor className="flex-grow-1" mc={monacoWorkerPath} vml={videomlWorkerPath} filesToInsert={filesToInsert} onInsertCode={onInsertCode} />
    </div>
    </div>
  )
}
