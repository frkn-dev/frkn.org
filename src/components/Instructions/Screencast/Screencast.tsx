import { useContext } from "react";

import { content } from "../../../content/instructions";
import { DataContext } from "../../../providers/DataProvider";

const Screeencast: React.FC<{ platform: string }> = (props) => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;

  const { subtitle, text, textLink } = content.screencastSection;
  const { url, preload, controls, poster, type } =
    content.instructions[props.platform].video;
  console.log("screencast");
  return (
    <div>
      <h3 className="text-2xl font-semibold pb-2">{subtitle[lang]}</h3>
      <video key={url} controls={controls} preload={preload} poster={poster}>
        <source src={url} type={type} />
        <p>
          {text[lang]}
          <a href={url} download>
            {textLink[lang]}
          </a>
        </p>
      </video>
    </div>
  );
};

export default Screeencast;
