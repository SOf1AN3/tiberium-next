'use client';

import { useTranslation } from 'react-i18next';

export default function AboutUs() {
   const { t } = useTranslation();

   const approaches = [
      { icon: '🎯', text: t('about_approach_list_1') },
      { icon: '🔬', text: t('about_approach_list_2') },
      { icon: '📊', text: t('about_approach_list_3') },
   ];

   return (
      <>
         <section className="page-hero">
            <h1>{t('about_main_title')}</h1>
            <p>{t('about_title')}</p>
         </section>

         <div className="page-body">
            <section className="about-overview">
               <p className="about-lead">{t('about_desc')}</p>
            </section>

            <div className="section-block">
               <div className="section-head">
                  <h2>{t('about_approach_title')}</h2>
               </div>
               <div className="about-cards">
                  {approaches.map((a, i) => (
                     <div className="about-card" key={i}>
                        <div className="card-icon" aria-hidden="true">{a.icon}</div>
                        <p>{a.text}</p>
                     </div>
                  ))}
               </div>
            </div>

            <div className="section-block">
               <div className="about-team">
                  <span className="team-tag">Since 2022</span>
                  <h2>{t('about_team_title')}</h2>
                  <p>{t('about_team_desc')}</p>
               </div>
            </div>

            <div className="cta-banner">
               <h3>{t('contact_form_title')}</h3>
               <p>{t('home_cta_secondary')}</p>
               <div className="cta-actions">
                  <a className="btn" href="mailto:contact@tiberium.com">contact@tiberium.com</a>
                  <a className="btn btn-ghost-light" href="https://wa.me/213666000000" target="_blank" rel="noopener noreferrer">
                     WhatsApp
                  </a>
               </div>
            </div>
         </div>
      </>
   );
}