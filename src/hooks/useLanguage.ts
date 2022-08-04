import {useState} from 'react';


export interface ILanguage {
	lang: 'ru' | 'en';
	setLang: (lang: 'ru' | 'en') => void;

}

function useLanguage(): ILanguage {
	const [language, setLanguage] = useState<ILanguage["lang"]>(valueFromLocalStorage());
	const changeLanguage = (lang: ILanguage["lang"]) => {
		setLanguage(lang);
		localStorage.setItem('language', lang);
	}

	function valueFromLocalStorage() //get value from localStorage or default value
	{
		const localStorageValue: string = localStorage.getItem('language') || '';
		if (localStorageValue !== '' && (localStorageValue == 'ru' || localStorageValue == 'en'))
			return localStorageValue;
		else {
			//if there is an invalid value in the local storage, then set the default value to 'ru'
			localStorage.setItem('language', 'ru');
			return 'ru';
		}
	}

	return {lang: language, setLang: changeLanguage};
}

export default useLanguage;