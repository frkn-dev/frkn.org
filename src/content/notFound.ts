export interface Lang {
  ru: string;
  en: string;
}

export interface NotFound {
  [key: string]: Lang;
}

export const notFound: NotFound = {
  header: {
    ru: 'Такой страницы не существует',
    en: 'This page does not exist',
  },
  subheader: {
    ru: 'Возможно вы искали:',
    en: 'Maybe you were looking for:',
  },
};
