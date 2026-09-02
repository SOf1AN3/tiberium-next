'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Cards = () => {
   const { t } = useTranslation();
   const [expandedCard, setExpandedCard] = useState<number | null>(null);

   const services = [
      {
         title: t('cards_consulting_title'),
         content: t('cards_consulting_content'),
         image: '/images/1.jpg'
      },
      {
         title: t('cards_market_title'),
         content: t('cards_market_content'),
         image: '/images/2.jpg'
      },
      {
         title: t('cards_training_title'),
         content: t('cards_training_content'),
         image: '/images/3.jpg'
      },
      {
         title: t('cards_digital_title'),
         content: t('cards_digital_content'),
         image: '/images/4.jpg'
      }
   ];

   const handleCardClick = (index: number) => {
      if (expandedCard === null) {
         setExpandedCard(index);
      }
   };

   const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedCard(null);
   };

   return (
      <div>
         <h1 className="services-title no-select">{t('cards_title')}</h1>
         <div className={`services-container ${expandedCard !== null ? 'expanded' : ''}`}>
            {services.map((service, index) => (
               <div
                  key={index}
                  className={`service-card ${expandedCard === index ? 'expanded' : ''}`}
                  onClick={() => handleCardClick(index)}
                  style={{ backgroundColor: `rgb(${index * 20}, ${index * 20}, ${index * 20})` }}
               >
                  {expandedCard !== index && <h2>{service.title}</h2>}
                  {expandedCard === index && (
                     <>
                        <div className="card-image">
                           <img src={service.image} alt={service.title} />
                        </div>
                        <div className="card-content">
                           <h2>{service.title}</h2>
                           <p className="service-content">{service.content}</p>
                        </div>
                        <button className="close-button" onClick={handleCloseClick}>
                           <img src="/images/exit.png" alt="Close" />
                        </button>
                     </>
                  )}
               </div>
            ))}
         </div>
      </div>
   );
};

export default Cards;
