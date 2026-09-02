'use client';

import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';

export default function Home() {
   const { t } = useTranslation();

   const features = [
      { icon: '📈', title: t('cards_consulting_title'), content: t('cards_consulting_content') },
      { icon: '🔍', title: t('cards_market_title'), content: t('cards_market_content') },
      { icon: '🎓', title: t('cards_training_title'), content: t('cards_training_content') },
      { icon: '💻', title: t('cards_digital_title'), content: t('cards_digital_content') },
   ];

   return (
      <>
         <section className="hero">
            <h1 className="no-select">
               <span className="accent-text">Tiberium</span>, {t('home_title')}
            </h1>
            <p>{t('about_desc')}</p>
            <div className="hero-actions">
               <a href="#services" className="btn btn-primary">
                  {t('home_cta_primary')}
               </a>
               <a href="mailto:contact@tiberium.com" className="btn btn-secondary">
                  {t('home_cta_secondary')}
               </a>
            </div>
            <div className="hero-stats">
               <div className="hero-stat">
                  <strong>2022</strong>
                  <span>{t('home_stat_since')}</span>
               </div>
               <div className="hero-stat">
                  <strong>+50</strong>
                  <span>{t('home_stat_clients')}</span>
               </div>
               <div className="hero-stat">
                  <strong>4</strong>
                  <span>{t('home_stat_services')}</span>
               </div>
            </div>
         </section>

         <section className="feature-grid" id="services" aria-label={t('header_services')}>
            {features.map((f, i) => (
               <div key={i} className="feature-card">
                  <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.content}</p>
               </div>
            ))}
         </section>

         <Footer />
      </>
   );
}