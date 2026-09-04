'use client';

import Footer from '@/components/Footer';
import PricingCards from '@/components/PricingCards';
import { useTranslation } from 'react-i18next';

export default function PricingPage() {
   const { t } = useTranslation();

   return (
      <main className="page-main">
         <section className="page-hero">
            <h1>{t('pricing_page_title')}</h1>
            <p>{t('pricing_page_subtitle')}</p>
         </section>

         <section className="pricing-section">
            <PricingCards />
            <p className="pricing-note">{t('pricing_note')}</p>
         </section>

         <Footer />
      </main>
   );
}
