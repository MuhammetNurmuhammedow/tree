import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tk from './locales/tk';
import en from './locales/en';
import ru from './locales/ru';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tk: tk,
      tr: tk, // Fallback alias
      en: en,
      ru: ru,
    },
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

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: 'tk', label: 'Türkmençe', badge: 'TK' },
  { code: 'en', label: 'English', badge: 'EN' },
  { code: 'ru', label: 'Русский', badge: 'RU' },
] as const;

export type LangCode = 'tk' | 'en' | 'ru';
