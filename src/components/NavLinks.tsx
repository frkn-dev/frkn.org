import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { DataContext } from '../App';
import { Lang, links } from '../content/navbar';

const NavLinks = () => {
  let location = useLocation().pathname;
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;

  return (
    <ul className="w-full flex flex-col lg:flex-row">
      {links.map((link, index) => (
        <li key={index}>
          <NavLink
            to={link.url}
            onClick={() => (document.body.style.overflowY = 'scroll')}
            className={`${
              location === link.url && 'text-zinc-900'
            } text-xl text-zinc-500 lg:text-lg p-4 rounded-lg w-full hover:bg-zinc-100 hover:text-zinc-900 flex justify-center lg:justify-start whitespace-nowrap`}
          >
            {link.text[lang as keyof Lang]}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default NavLinks;
