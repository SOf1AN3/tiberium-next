'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';

export default function Home() {
   const { t } = useTranslation();

   return (
      <div className="background">
         <div className="background-overlay"></div>
         <Header />
         <div className="background-pos">
            <h1 className="home-title no-select">{t('home_title')}</h1>
         </div>
         <Footer />
      </div>
   );
}
