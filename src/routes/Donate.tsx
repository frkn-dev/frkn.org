import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../App';
import { content } from '../content/donate';
import DonateCard from '../components/DonateCard';
import Navbar from '../components/Navbar';

const Donate = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;

  const getDonateOptions = (category: string) => {
    return Object.keys(content.options[category]).map((key, index) => {
      const option = content.options[category][key];
      return (
        <DonateCard
          key={index}
          img={option.img}
          text={option.text[lang]}
          title={option.title}
          url={option.url}
          address={option.address}
        />
      );
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <Navbar />
      <main className="my-auto p-6">
        <h1 className="font-semibold text-3xl lg:text-[40px] text-zinc-800 mt-6 whitespace-pre-wrap mb-12">
          {content.header[lang]}
        </h1>
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          {getDonateOptions('common')}
        </div>
        <h2 className="mt-12 text-2xl font-semibold">{content.crypto[lang]}</h2>
        <div className="flex flex-col md:flex-row gap-4 mt-6 flex-wrap">
          {getDonateOptions('crypto')}
        </div>
      </main>
    </div>
  );
};

export default Donate;
