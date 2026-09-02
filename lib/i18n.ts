import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '@/locales/en/translation.json';
import frTranslation from '@/locales/fr/translation.json';
import esTranslation from '@/locales/es/translation.json';
import arTranslation from '@/locales/ar/translation.json';

export interface LanguageInfo {
   code: string;
   label: string; // nom affiché dans la langue courante
   short: string; // code court pour le badge
   dir: 'ltr' | 'rtl';
}

export const LANGUAGES: Record<string, LanguageInfo> = {
   en: { code: 'en', label: 'English', short: 'EN', dir: 'ltr' },
   fr: { code: 'fr', label: 'Français', short: 'FR', dir: 'ltr' },
   es: { code: 'es', label: 'Español', short: 'ES', dir: 'ltr' },
   ar: { code: 'ar', label: 'العربية', short: 'AR', dir: 'rtl' },
};

export const SUPPORTED_LANGUAGES = Object.values(LANGUAGES);

const resources = {
   en: { translation: enTranslation },
   fr: { translation: frTranslation },
   es: { translation: esTranslation },
   ar: { translation: arTranslation },
};

i18n.use(initReactI18next).init({
   resources,
   lng: 'en',
   fallbackLng: 'en',
   interpolation: {
      escapeValue: false, // React already escapes values
   },
});

export default i18n;