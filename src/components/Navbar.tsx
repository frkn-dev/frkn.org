import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../App';
import Button from './Button';
import LangSwitch from './LangSwitch';

const Navbar = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;
  return (
    <nav className="flex items-center justify-between p-6">
      <Link to="/" className="flex items-center gap-2 lg:gap-4">
        <img
          src="/images/icon512x512.png"
          alt="Logo"
          className="h-12 mx-auto"
        />
        <span className="font-bold text-2xl">FuckRKN1</span>
      </Link>
      <LangSwitch lang={lang} setLang={setLang} />
      <div className="hidden md:visible">
        <Button text="Установить" url="/" role="primary" />
      </div>
    </nav>
  );
};

export default Navbar;
