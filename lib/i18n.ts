import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from '@/locales/en/translation.json';
import frTranslation from '@/locales/fr/translation.json';

const resources = {
   en: {
      translation: enTranslation,
   },
   fr: {
      translation: frTranslation,
   },
};

i18n
   .use(initReactI18next)
   .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
         escapeValue: false, // React already escapes values
      },
   });

export default i18n;
