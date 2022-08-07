import { useContext, useState } from "react";

import { DataContext } from "../providers/DataProvider";
import { content } from "../content/instructions";
import Navbar from "../components/Navbar";
import PlatformNavigation from "../components/PlatformNavigation";
import Instructions from "../components/Instructions/Instructions";

const Installation = () => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;

  const [platform, setPlatform] = useState<string>(getOS());

  function getOS(): string {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'];

    if (macosPlatforms.indexOf(platform) !== -1) {
      return  'macos';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      return  'ios';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      return  'windows';
    } else if (/Android/.test(userAgent)) {
      return  'android';
    } else return 'linux';
  }

  function platformHandler(platform: string) {
    setPlatform(platform);
  }

  return (
    <div className="min-h-screen flex flex-col md:max-w-xl lg:max-w-6xl mx-auto">
      <Navbar />
      <main className="p-6">
        <h1 className="font-semibold text-3xl lg:text-[40px] text-zinc-800 mt-6 whitespace-pre-wrap mb-12">
          {content.header[lang]}
        </h1>
        <PlatformNavigation
          onSetPlatform={platformHandler}
          activePlatform={platform}
        />
        <Instructions platform={platform} />
      </main>
    </div>
  );
};

export default Installation;
