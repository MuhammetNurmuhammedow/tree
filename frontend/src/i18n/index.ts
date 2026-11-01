import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tk from './locales/tk';
import en from './locales/en';
import ru from './locales/ru';

// The app is available in exactly these three languages.
export const SUPPORTED_LANGUAGES = [
  { code: 'tk', label: 'Türkmençe', badge: 'TK' },
  { code: 'en', label: 'English', badge: 'EN' },
  { code: 'ru', label: 'Русский', badge: 'RU' },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { tk, en, ru },
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    // Map regional browser locales (en-US, ru-RU) onto the base language.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    // Default language is Turkmen
    fallbackLng: 'tk',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'familytree_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

const syncHtmlLang = (lng: string) => {
  document.documentElement.lang = i18n.resolvedLanguage ?? lng;
  document.title = i18n.t('app.title');
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
