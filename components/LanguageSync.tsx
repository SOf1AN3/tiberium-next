'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/lib/i18n';

const LanguageSync = () => {
   const { i18n } = useTranslation();

   useEffect(() => {
      const info = LANGUAGES[i18n.language] || LANGUAGES.en;
      if (document.documentElement.lang !== info.code) {
         document.documentElement.lang = info.code;
      }
      if (document.documentElement.dir !== info.dir) {
         document.documentElement.dir = info.dir;
      }
   }, [i18n.language]);

   return null;
};

export default LanguageSync;