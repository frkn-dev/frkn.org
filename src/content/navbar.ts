export interface Lang {
  ru: string;
  en: string;
}

export interface NavLink {
  text: Lang;
  url: string;
}

export const links: NavLink[] = [
  {
    text: {
      ru: 'Главная',
      en: 'Home',
    },
    url: '/',
  },
  {
    text: {
      ru: 'О проекте',
      en: 'About us',
    },
    url: '/about',
  },
  {
    text: {
      ru: 'Поддержать нас',
      en: 'Support us',
    },
    url: '/support',
  },
];
