import React, {createContext} from "react";
import useLanguage, {ILanguage} from "../hooks/useLanguage";

type Props = {
	children: React.ReactNode | React.ReactNode[] | null | undefined;
};

const DataContext = createContext<ILanguage | null>(null);
const DataProvider = ({children}: Props) => {
	const {lang, setLang} = useLanguage();
	return (
		<DataContext.Provider value={{
			lang: lang,
			setLang: setLang
		}
		}>
			{children}
		</DataContext.Provider>)
};

export {
	DataContext,
	DataProvider
};
