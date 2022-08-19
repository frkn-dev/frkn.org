import {
  faGithub,
  faTelegram,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../providers/DataProvider';
import Button from '../components/Button';
import LangSwitch from '../components/LangSwitch';
import SocialLink from '../components/SocialLink';
import { content } from '../content/home';
import MailchimpFormContainer from '../components/MailchimpFormContainer';

const Home = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;

  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <nav className="flex items-center justify-between p-6 lg:pt-12">
        <Link to="/" className="text-3xl lg:hidden font-bold flex-1">
          FuckRKN1
        </Link>
        <div className="lg:flex-1 lg:ml-[50%]">
          <LangSwitch lang={lang} setLang={setLang} />
        </div>

        
      </nav>
      <main className="flex my-auto flex-col lg:flex-row p-6">
        <div className="flex-1">
          <img
            src="/images/icon512x512.png"
            alt="Logo"
            className="w-3/4 lg:w-4/5 mx-auto"
          />
        </div>
        <div className="flex-1 text-center lg:text-start whitespace-pre-wrap ">
          <h1 className="font-semibold text-3xl lg:text-[40px] text-zinc-800 mt-6">
            {content.header[lang]}
          </h1>
          <p className="text-zinc-500 mt-6 whitespace-pre-wrap lg:text-xl">
            {content.subheader[lang]}
          </p>
          <div className="flex flex-wrap mt-10 gap-4">
            <Button text={content.install[lang]} url="install" role="primary" />
            <Button text={content.donate[lang]} url="support" />
            <Button text={content.about[lang]} url="about" />
          </div>
          <div className="flex justify-center gap-8 mt-12 lg:justify-start mb-12">
            <SocialLink icon={faTwitter} url="https://twitter.com/FuckRKN1" />
            <SocialLink icon={faTelegram} url="https://t.me/FuckRKN1" />
            <SocialLink
              icon={faGithub}
              url="https://github.com/nezavisimost/FuckRKN1"
            />
          </div>
          <MailchimpFormContainer />
        </div>
      </main>
    </div>
  );
};

export default Home;
