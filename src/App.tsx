import { createContext, Dispatch, SetStateAction, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './routes/Home';
import Donate from './routes/Donate';
import NotFound from './routes/NotFound';

interface DataContextType {
  lang: string;
  setLang: Dispatch<SetStateAction<string>>;
}

export const DataContext = createContext<DataContextType | null>(null);

function App() {
  const [lang, setLang] = useState('ru');

  return (
    <DataContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="support" element={<Donate />} />
          {/* <Route path="about" element={<About />} />
          <Route path="installation" element={<Install />} /> */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

export default App;
