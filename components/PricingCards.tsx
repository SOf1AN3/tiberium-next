'use client';

import { useTranslation } from 'react-i18next';

const PricingCards = () => {
   const { t } = useTranslation();

   const tiers = [
      {
         tier: 'simple',
         title: t('pricing_simple_title'),
         desc: t('pricing_simple_desc'),
         features: [
            t('pricing_simple_feat_1'),
            t('pricing_simple_feat_2'),
            t('pricing_simple_feat_3'),
            t('pricing_simple_feat_4'),
         ],
         highlighted: false,
      },
      {
         tier: 'advanced',
         title: t('pricing_advanced_title'),
         desc: t('pricing_advanced_desc'),
         features: [
            t('pricing_advanced_feat_1'),
            t('pricing_advanced_feat_2'),
            t('pricing_advanced_feat_3'),
            t('pricing_advanced_feat_4'),
            t('pricing_advanced_feat_5'),
         ],
         highlighted: true,
      },
      {
         tier: 'premium',
         title: t('pricing_premium_title'),
         desc: t('pricing_premium_desc'),
         features: [
            t('pricing_premium_feat_1'),
            t('pricing_premium_feat_2'),
            t('pricing_premium_feat_3'),
            t('pricing_premium_feat_4'),
            t('pricing_premium_feat_5'),
            t('pricing_premium_feat_6'),
         ],
         highlighted: false,
      },
   ];

   return (
      <div className="pricing-grid">
         {tiers.map((tier) => (
            <div
               key={tier.tier}
               className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
            >
               {tier.highlighted && (
                  <div className="pricing-badge">{t('pricing_badge_recommended')}</div>
               )}
               <div className={`pricing-icon pricing-icon--${tier.tier}`}>
                  {tier.tier === 'simple' && '⚡'}
                  {tier.tier === 'advanced' && '🚀'}
                  {tier.tier === 'premium' && '💎'}
               </div>
               <h3 className="pricing-card-title">{tier.title}</h3>
               <p className="pricing-card-desc">{tier.desc}</p>
               <ul className="pricing-features">
                  {tier.features.map((feat, i) => (
                     <li key={i} className="pricing-feature">
                        <span className="pricing-check" aria-hidden="true">✓</span>
                        <span>{feat}</span>
                     </li>
                  ))}
               </ul>
               <a href="mailto:contact@tiberium.com" className="btn pricing-cta">
                  {t('pricing_cta_contact')}
               </a>
            </div>
         ))}
      </div>
   );
};

export default PricingCards;
