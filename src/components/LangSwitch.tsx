import React from 'react';
import {ILanguage} from "../hooks/useLanguage";

const LangSwitch = ({ lang, setLang }: ILanguage) => {
  return (
    <div className="flex">
      <div
        className={`transition-all duration-200 px-6 py-4 leading-none cursor-pointer  rounded-l ${
          lang === 'ru'
            ? 'bg-zinc-800 text-zinc-50 hover:bg-zinc-900'
            : 'bg-zinc-100 hover:bg-zinc-200'
        }`}
        onClick={() => setLang('ru')}
      >
        ru
      </div>
      <div
        className={`transition-all duration-200 px-6 py-4 leading-none cursor-pointer rounded-r ${
          lang === 'en'
            ? 'bg-zinc-800 text-zinc-50 hover:bg-zinc-900'
            : 'bg-zinc-100 hover:bg-zinc-200'
        }`}
        onClick={() => setLang('en')}
      >
        en
      </div>
    </div>
  );
};

export default LangSwitch;
