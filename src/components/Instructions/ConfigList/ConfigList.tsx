import { useContext } from "react";

import { content } from "../../../content/instructions";
import { DataContext } from "../../../providers/DataProvider";

const ConfigList: React.FC<{ platform: string }> = (props) => {
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang } = appContext;

  const { subtitle } = content.configSection;

  const getFilesListElem = () => {
    const { configFiles } = content.instructions[props.platform];
    return configFiles.map((file: object, index: string) => {
      const values = Object.entries(file);

      return values.map(([key, value]) => {
        return (
          <li key={`${index}${key}`} className="py-1">
            <a href={value} download>
              {key}
            </a>
          </li>
        );
      });
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-semibold pb-2">{subtitle[lang]}</h3>
      <ul className="list-disc pl-8">{getFilesListElem()}</ul>
    </div>
  );
};

export default ConfigList;
