import Tippy from '@tippyjs/react';
import {
  DetailedHTMLProps,
  HTMLAttributes,
  LegacyRef,
  MutableRefObject,
  useRef,
} from 'react';
import 'tippy.js/dist/tippy.css';

interface CardProps {
  img: string;
  title: string;
  text: string;
  url?: string;
  address?: string;
}

const DonateCard = ({ img, title, text, url, address }: CardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const copyToClipboard = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <article
      onClick={copyToClipboard}
      className="flex flex-auto lg:flex-initial bg-zinc-100 py-6 px-4 md:px-8 lg:pr-10 rounded-lg cursor-pointer hover:bg-zinc-200 transition-all duration-200 relative"
      ref={ref}
    >
      <img src={img} alt="" className="w-12 h-12" />
      <div className="ml-4">
        <h3 className="text-lg">{title}</h3>
        <p className="text-zinc-500 text-sm">{text}</p>
      </div>
      {address && (
        <Tippy content="Скопировано" reference={ref} trigger="click" />
      )}
      {url && <a href={url} className="absolute w-full h-full"></a>}
    </article>
  );
};

export default DonateCard;
