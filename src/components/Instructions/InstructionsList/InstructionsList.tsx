import { useContext } from "react";

import { content } from "../../../content/instructions";
import { DataContext } from '../../../providers/DataProvider';

interface Lang {
    ru: string;
    en: string;
}

const InstructionsList: React.FC<{ platform: string }> = (props) => {
    const appContext = useContext(DataContext);
    if (!appContext) return null;
    const { lang } = appContext;

    const { subtitle } = content.instSection;

    const getInstruttionsSteps = (language: string) => {
        const stepsArray = content.instructions[props.platform].steps;

        return stepsArray.map((step: Lang, index: string) => {
            const text = step[language as keyof Lang];

            function createMarkup() {
                return { __html: text };
            }

            function ListComponent() {
                return (
                    <li
                        className="py-1"
                        dangerouslySetInnerHTML={createMarkup()}
                    />
                );
            }
            return <ListComponent key={index} />;
        });
    };

    return (
        <div className="mb-6">
            <h3 className="text-2xl font-semibold pb-2">{subtitle[lang]}</h3>
            <ol className="list-decimal pl-8">{getInstruttionsSteps(lang)}</ol>
        </div>
    );
};

export default InstructionsList;
