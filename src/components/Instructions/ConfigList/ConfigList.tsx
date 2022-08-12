import { useContext } from "react";

import { content } from "../../../content/instructions";
import { DataContext } from "../../../providers/DataProvider";

interface File {
  title: string;
  link: string;
}

const ConfigList: React.FC<{ platform: string }> = (props) => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;

  const { subtitle } = content.configSection;

  const getFilesListItem = () => {
    const { configFiles } = content.instructions[props.platform];

    return configFiles.map((files: File, index: string) => {
      return (
        <li key={index}>
          <a href={files.link} download>
            {files.title}
          </a>
        </li>
      );
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold pb-2">{subtitle[lang]}</h3>
      <ul className="list-disc pl-8">{getFilesListItem()}</ul>
    </div>
  );
};

export default ConfigList;
