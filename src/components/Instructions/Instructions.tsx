import { useContext } from "react";

import { content } from "../../content/instructions";
import { DataContext } from "../../providers/DataProvider";
import ConfigList from "./ConfigList/ConfigList";
import InstructionsList from "./InstructionsList/InstructionsList";
import Screeencast from "./Screencast/Screencast";

const Instructions: React.FC<{ platform: string }> = ({ platform }) => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;

  const instObj = content.instructions[platform];

  const { title } = instObj;
  const { configFiles } = instObj;
  const { steps } = instObj;
  const { video } = instObj;

  return (
    <article className="flex flex-col">
      <h2 className="font-semibold text-3xl lg:text-[40px] text-zinc-800 mt-6 whitespace-pre-wrap mb-6">
        {title}
      </h2>
      {configFiles && <ConfigList platform={platform} />}
      {steps && <InstructionsList platform={platform} />}
      {video && <Screeencast platform={platform} />}
    </article>
  );
};

export default Instructions;
