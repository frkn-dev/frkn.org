import { useContext } from "react";
import { DataContext } from "../App";
import { content } from "../content/instructions";

interface IPlatform {
    id: string;
    img: string;
    title: string;
}

const PlatformNavigation: React.FC<{
    onSetPlatform: (platform: string) => void;
    activePlatform: string;
}> = (props) => {
    const appContext = useContext(DataContext);
    if (!appContext) return null;
    const { lang } = appContext;

    const { options } = content;

    const liClassName =
        "flex flex-auto lg:flex-initial bg-zinc-100 py-4 px-4 md:px-4 lg:pr-10 rounded-lg cursor-pointer hover:bg-zinc-200 transition-all duration-200 relative";
    const liActiveClassName = "bg-zinc-300";

    return (
        <div className="flex flex-col md:max-w-xl lg:max-w-6xl mx-auto pb-6">
            <h2 className="text-2xl font-semibold">
                {content.platforms[lang]}
            </h2>
            <ul className="flex flex-col md:flex-row gap-4 mt-6 flex-wrap">
                {options.map((platform: IPlatform) => {
                    return (
                        <li
                            key={platform.id}
                            onClick={() => props.onSetPlatform(platform.id)}
                            className={
                                props.activePlatform === platform.id
                                    ? `${liClassName} ${liActiveClassName}`
                                    : `${liClassName}`
                            }
                        >
                            <img
                                src={platform.img}
                                alt={platform.title}
                                className="w-6 h-6"
                            />
                            <p className="ml-4 text-lg">{platform.title}</p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default PlatformNavigation;
