import React, { useContext } from 'react';
import { DataContext } from '../providers/DataProvider';
import Button from '../components/Button';
import NavLinks from '../components/NavLinks';
import { content } from '../content/home';
import { Lang } from '../content/navbar';
import { notFound } from '../content/notFound';

const NotFound = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang} = appContext;
  console.log(lang);

  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <main className="my-auto p-6 flex flex-col text-center lg:text-start">
        <p className="text-9xl mb-4 font-bold">404</p>
        <h1 className="text-3xl mb-12">
          {notFound.header[lang as keyof Lang]}
        </h1>
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-12">
          <p className="text-xl whitespace-nowrap">
            {notFound.subheader[lang as keyof Lang]}
          </p>
          <NavLinks />
        </div>

        <div className="flex ">
          <Button text={content.install[lang]} url="/" role="primary" />
        </div>
      </main>
    </div>
  );
};

export default NotFound;
