
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Donate from './routes/Donate';
import NotFound from './routes/NotFound';
import {DataProvider} from "./providers/DataProvider";

function App() {

  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="support" element={<Donate />} />
          {/* <Route path="about" element={<About />} />
          <Route path="installation" element={<Install />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
