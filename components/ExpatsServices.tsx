'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ExpatsServices = () => {
   const { t } = useTranslation();
   const [activeIndex, setActiveIndex] = useState<number | null>(0);

   const questions = [
      t('expats_question_1'),
      t('expats_question_2'),
      t('expats_question_3'),
      t('expats_question_4'),
      t('expats_question_5'),
      t('expats_question_6'),
   ];

   const answers = [
      t('expats_answer_1'),
      t('expats_answer_2'),
      t('expats_answer_3'),
      t('expats_answer_4'),
      t('expats_answer_5'),
      t('expats_answer_6'),
   ];

   const toggleQuestion = (index: number) => {
      setActiveIndex(activeIndex === index ? null : index);
   };

   const formatAnswer = (answer: string) => {
      return answer.split('\n').map((line, index) => (
         <React.Fragment key={index}>
            {line}
            <br />
         </React.Fragment>
      ));
   };

   return (
      <>
         <section className="page-hero">
            <h1>{t('expats_title')}</h1>
            <p>{t('expats_welcome')}</p>
         </section>

         <div className="page-body">
            <div className="expats-intro">
               <div>
                  <div className="intro-icon" aria-hidden="true">✈️</div>
                  <h2>{t('expats_mission_title')}</h2>
                  <p>{t('expats_mission_desc')}</p>
               </div>
               <div className="expats-mission">
                  <span className="mission-label">{t('expats_question_6')}</span>
                  <div className="expats-count">
                     <strong>{questions.length}</strong>
                     <span>{t('home_stat_services')}</span>
                  </div>
                  <p>{t('expats_contact_desc')}</p>
               </div>
            </div>

            <div className="section-block">
               <div className="section-head">
                  <h2>{t('expats_services_title')}</h2>
               </div>
               <div className="question-list">
                  {questions.map((question, index) => (
                     <div key={index} className={`question ${activeIndex === index ? 'active' : ''}`}>
                        <div className="question-header" onClick={() => toggleQuestion(index)}>
                           <span className="question-num">
                              {String(index + 1).padStart(2, '0')}
                           </span>
                           {question}
                           <span className="question-chevron" aria-hidden="true">▾</span>
                        </div>
                        <div className="answer">{formatAnswer(answers[index])}</div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="cta-banner">
               <h3>{t('expats_contact_title')}</h3>
               <p>{t('expats_contact_desc')}</p>
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
};

export default ExpatsServices;