import { useContext } from "react";

import { DataContext } from "../providers/DataProvider";
import { content } from "../content/instructions";
import Navbar from "../components/Navbar";

import PlatformsInstruction from "../components/PlatformsInstruction";

const Installation = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;

  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <Navbar />
      <main className="p-6">
        <h1 className="font-semibold text-3xl lg:text-[40px] text-zinc-800 mt-6 whitespace-pre-wrap mb-12">
          {content.header[lang]}
        </h1>
        <PlatformsInstruction />
      </main>
    </div>
  );
};

export default Installation;
