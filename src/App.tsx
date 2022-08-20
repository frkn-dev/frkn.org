import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Donate from './routes/Donate';
import About from './routes/About';
import NotFound from './routes/NotFound';
import { DataProvider } from './providers/DataProvider';
import Installation from './routes/Installation';

function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="support" element={<Donate />} />
          <Route path="about" element={<About />} />
          <Route path="install" element={<Installation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}

export default App;
