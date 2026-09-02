'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

const Header = () => {
   const { t } = useTranslation();
   const [isMenuOpen, setMenuOpen] = useState(false);
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   const { user, logout } = useAuth();
   const router = useRouter();

   const toggleMenu = () => {
      setMenuOpen(!isMenuOpen);
   };

   const handleAuthClick = () => {
      if (user) {
         setShowLogoutConfirm(true);
      } else {
         router.push('/login');
      }
   };

   const handleSettingsClick = () => {
      router.push('/login');
   };

   const confirmLogout = async () => {
      try {
         await logout();
         router.push('/');
      } catch (error) {
         console.error('Erreur lors de la déconnexion:', error);
      } finally {
         setShowLogoutConfirm(false);
      }
   };

   const cancelLogout = () => {
      setShowLogoutConfirm(false);
   };

   const changeLanguage = () => {
      const newLanguage = i18n.language === 'en' ? 'fr' : 'en';
      i18n.changeLanguage(newLanguage);
   };

   return (
      <div className="no-select">
         <header className={isMenuOpen ? 'show-menu menu-open' : ''}>
            <Link href="/" draggable="false">
               <h5 className="logo-text">Tiberium</h5>
            </Link>
            <ul className="header-list">
               <li><Link href="/" draggable="false">{t('header_home')}</Link></li>
               <li><Link href="/services" draggable="false">{t('header_services')}</Link></li>
               <li><Link href="/expats" draggable="false">{t('header_expats')}</Link></li>
               <li><Link href="/contact" draggable="false">{t('header_contact')}</Link></li>
               <li><Link href="/about" draggable="false">{t('header_about')}</Link></li>
               <li><Link href="/messages" draggable="false">{t('header_chat')}</Link></li>
            </ul>

            <button className="menu-button" onClick={toggleMenu}>
               <img draggable="false" src="/images/menu.png" alt="Menu" />
            </button>

            <div className="header_right_section">
               <button className="connexion-btn btn" onClick={changeLanguage}>
                  {t('language_btn')}
               </button>
               <button className="connexion-btn btn" onClick={handleSettingsClick}>
                  {t('header_settings')}
               </button>
               <button className="connexion-btn btn" onClick={handleAuthClick}>
                  {user ? t('header_logout') : t('header_login')}
               </button>
            </div>

            {isMenuOpen && (
               <button className="exit-button btn" onClick={toggleMenu}>
                  <img draggable="false" src="/images/exit.png" alt="Exit" />
               </button>
            )}

            {showLogoutConfirm && (
               <div className="logout-confirm-overlay">
                  <div className="logout-confirm-popup">
                     <p>{t('logout_confirm_message')}</p>
                     <button className="confirm-btn" onClick={confirmLogout}>
                        {t('logout_confirm_yes')}
                     </button>
                     <button className="cancel-btn" onClick={cancelLogout}>
                        {t('logout_confirm_no')}
                     </button>
                  </div>
               </div>
            )}
         </header>
      </div>
   );
};

export default Header;
