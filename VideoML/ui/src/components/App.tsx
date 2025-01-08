import { TimelineProvider } from './Timeline/Context/Provider';
import { PythonVisualizerProvider } from './PythonVisualizer/Context/Provider';
import { VideoGeneratorProvider } from './Video/Generator/Context/Provider';
import { Home } from './Home/Home';

const App: React.FC = () => {
  return (
    <PythonVisualizerProvider>
      <TimelineProvider>
        <VideoGeneratorProvider>
          <Home />
        </VideoGeneratorProvider>
      </TimelineProvider>
    </PythonVisualizerProvider>
  )
}

export default App;
