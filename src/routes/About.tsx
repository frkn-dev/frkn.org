import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../providers/DataProvider';
import { content } from '../content/about';
import DonateCard from '../components/DonateCard';
import Navbar from '../components/Navbar';

const About = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;


  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <Navbar />
      <main className="my-auto p-6">
        <h1 className="font-semibold text-3xl lg:text-[25px] text-zinc-800 mt-6 whitespace-pre-wrap mb-12">
          {content.about[lang]}
        </h1>

      </main>
    </div>
  );
};

export default About;
