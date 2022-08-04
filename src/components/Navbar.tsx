import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { DataContext } from '../App';
import Button from './Button';
import LangSwitch from './LangSwitch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import MailchimpFormContainer from './MailchimpFormContainer';
import { content } from '../content/home';
import { Lang, links } from '../content/navbar';
import NavLinks from './NavLinks';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  let location = useLocation().pathname;
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;
  useEffect(() => {
    document.body.style.overflowY = open ? 'hidden' : 'scroll';
  }, [open]);

  return (
    <header
      className={`px-6 py-6 lg:py-12 ${
        open &&
        'h-screen w-full overflow-hidden fixed left-0 top-0 z-10 bg-white lg:relative'
      }`}
    >
      <nav className="flex flex-col h-full items-stretch md:max-w-xl lg:max-w-none mx-auto lg:mx-0 lg:flex-row lg:justify-between lg:items-center leading-none">
        <div className="flex w-full lg:flex-1 justify-between lg:w-auto">
          <Link to="/" className="flex items-center gap-2 lg:gap-4">
            <img
              src="/images/icon512x512.png"
              alt="Logo"
              className="h-12 mx-auto hidden lg:flex"
            />
            <span className="font-bold text-2xl">FuckRKN1</span>
          </Link>
          <LangSwitch lang={lang} setLang={setLang} />
          <div
            className="flex items-center justify-center w-7 lg:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <FontAwesomeIcon
                icon={faXmark}
                size={'2x'}
                className="transition-all duration-200"
              />
            ) : (
              <FontAwesomeIcon
                icon={faBars}
                size={'2x'}
                className="transition-all duration-200"
              />
            )}
          </div>
        </div>
        <div
          className={`${
            open ? 'flex' : 'hidden'
          } lg:flex flex-col items-center justify-center h-full lg:h-auto gap-4 lg:ml-12 lg:flex-row`}
        >
          <img
            src="/images/icon512x512.png"
            alt="Logo"
            className="h-40 lg:hidden"
          />
          <NavLinks />
          <div className="lg:hidden">
            <MailchimpFormContainer />
          </div>
          <div
            className="flex w-fit"
            onClick={() => (document.body.style.overflowY = 'scroll')}
          >
            <Button text={content.install[lang]} url="/" role="primary" />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
