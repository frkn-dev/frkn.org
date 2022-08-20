import { useContext, useRef, useState } from 'react';
import { content } from '../content/donate';
import { DataContext } from '../providers/DataProvider';

interface CardProps {
  img: string;
  title: string;
  text: string;
  url?: string;
  address?: string;
}

const DonateCard = ({ img, title, url, address }: CardProps) => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const copyToClipboard = () => {
    if (address) navigator.clipboard.writeText(address);
    setCopied(true);
  };

  return (
    <article
      onClick={copyToClipboard}
      className="flex flex-auto lg:flex-initial bg-zinc-100 py-6 px-4 md:px-8 lg:pr-10 rounded-lg cursor-pointer hover:bg-zinc-200 transition-all duration-200 relative"
      ref={ref}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => {
        setVisible(false);
        setCopied(false);
      }}
    >
      <img src={img} alt="" className="w-12 h-12" />
      <div className="ml-4 flex flex-col justify-center ">
        <h3 className="text-lg">{title}</h3>
      </div>
      {address && (
        <div
          className={`absolute top-[-40px] text-sm p-2 px-4 bg-zinc-900 text-zinc-50 left-1/2 -translate-x-1/2 w-fit whitespace-nowrap rounded-lg transition-all duration-200 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {copied ? content.copied[lang] : content.copy[lang]}
        </div>
      )}
      {url && (
        <a
          href={url}
          className="absolute top-0 left-0 w-full h-full"
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      )}
    </article>
  );
};

export default DonateCard;
