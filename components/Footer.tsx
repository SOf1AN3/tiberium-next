'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const Footer = () => {
   const { t } = useTranslation();
   const year = new Date().getFullYear();

   return (
      <footer className="footer">
         <div className="footer-inner">
            <div className="footer-brand">
               <span className="header-logo">
                  <span className="header-logo-mark" aria-hidden="true"></span>
                  <span style={{ fontWeight: 800 }}>Tiberium</span>
               </span>
               <p>{t('footer_description')}</p>
            </div>
            <div className="footer-col">
               <h4>{t('footer_navigation')}</h4>
               <Link href="/">{t('footer_nav_home')}</Link>
               <Link href="/expats">{t('header_expats')}</Link>
               <Link href="/about">{t('footer_nav_about')}</Link>
            </div>
            <div className="footer-col">
               <h4>{t('footer_contact')}</h4>
               <a href="mailto:contact@tiberium.com">contact@tiberium.com</a>
               <a href="https://wa.me/213666000000" target="_blank" rel="noopener noreferrer">
                  +213 666 00 00 00
               </a>
            </div>
         </div>
         <div className="footer-bottom">
            <span>{t('footer_copyright', { year })}</span>
            <span className="myks">Developed By Myks Studios</span>
         </div>
      </footer>
   );
};

export default Footer;
