'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n, { SUPPORTED_LANGUAGES, LANGUAGES } from '@/lib/i18n';
import ThemeToggle from '@/components/ThemeToggle';

const toInitials = (name: string | undefined) =>
   (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');

const Header = () => {
   const { t } = useTranslation();
   const [isMenuOpen, setMenuOpen] = useState(false);
   const [profileOpen, setProfileOpen] = useState(false);
   const [langOpen, setLangOpen] = useState(false);
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   const { user, logout } = useAuth();
   const router = useRouter();

   const closeMenu = () => setMenuOpen(false);

   const handleSettingsClick = () => {
      closeMenu();
      setProfileOpen(false);
      if (user?.type === 'admin') {
         router.push('/admin');
      } else if (user) {
         router.push('/messages');
      } else {
         router.push('/login');
      }
   };

   const confirmLogout = async () => {
      try {
         setProfileOpen(false);
         await logout();
         router.push('/');
      } catch (error) {
         console.error('Erreur lors de la déconnexion:', error);
      } finally {
         setShowLogoutConfirm(false);
      }
   };

   const cancelLogout = () => setShowLogoutConfirm(false);

   const selectLanguage = (code: string) => {
      i18n.changeLanguage(code);
      setLangOpen(false);
   };

   const activeLang = LANGUAGES[i18n.language] || LANGUAGES.en;
   const userInitials = toInitials(user?.name);

   return (
      <>
         <header className="header">
            <div className="header-inner">
               <Link href="/" draggable="false" className="header-logo" onClick={closeMenu}>
                  <span className="header-logo-mark" aria-hidden="true"></span>
                  <span className="logo-text no-select">Tiberium</span>
               </Link>

               <ul className="header-list" role="navigation" aria-label="Main navigation">
                  <li><Link href="/" draggable="false">{t('header_home')}</Link></li>
                  <li><Link href="/expats" draggable="false">{t('header_expats')}</Link></li>
                  <li><Link href="/pricing" draggable="false">{t('header_pricing')}</Link></li>
                  <li><Link href="/about" draggable="false">{t('header_about')}</Link></li>
                  {user && <li><Link href="/messages" draggable="false">{t('header_chat')}</Link></li>}
               </ul>

               <div className="header-actions">
                  <div className="lang-menu-wrap">
                     <button
                        className="lang-toggle"
                        onClick={() => setLangOpen((o) => !o)}
                        aria-label="Change language"
                        aria-haspopup="listbox"
                        aria-expanded={langOpen}
                     >
                        <span className="lang-globe" aria-hidden="true">🌐</span>
                        {activeLang.short}
                        <span className="lang-caret" aria-hidden="true">▾</span>
                     </button>
                     {langOpen && (
                        <>
                           <div className="header-backdrop" onClick={() => setLangOpen(false)}></div>
                           <div className="lang-menu">
                              {SUPPORTED_LANGUAGES.map((lang) => (
                                 <button
                                    key={lang.code}
                                    className={`lang-menu-item ${lang.code === activeLang.code ? 'active' : ''}`}
                                    onClick={() => selectLanguage(lang.code)}
                                 >
                                    <span className="lang-label">{lang.label}</span>
                                    <span className="lang-short">{lang.short}</span>
                                 </button>
                              ))}
                           </div>
                        </>
                     )}
                  </div>

                  <ThemeToggle />

                  {user ? (
                     <div className="header-profile">
                        <button
                           className="avatar-btn"
                           onClick={() => setProfileOpen((o) => !o)}
                           aria-label="Open profile menu"
                           aria-expanded={profileOpen}
                        >
                           {userInitials}
                        </button>
                        {profileOpen && (
                           <>
                              <div className="header-backdrop" onClick={() => setProfileOpen(false)}></div>
                               <div className="profile-dropdown">
                                  <div className="profile-head">
                                     <div className="name">{user.name}</div>
                                     <div className="role">
                                        {user.type === 'admin' ? 'Admin' : 'Member'}
                                     </div>
                                  </div>
                                  {user.type === 'admin' && (
                                     <button className="dropdown-item" onClick={handleSettingsClick}>
                                        {t('header_admin_panel')}
                                     </button>
                                  )}
                                  <button className="dropdown-item danger" onClick={() => setShowLogoutConfirm(true)}>
                                     {t('header_logout')}
                                  </button>
                               </div>
                           </>
                        )}
                     </div>
                  ) : (
                     <div className="header-auth">
                        <Link href="/login" className="btn btn-secondary">
                           {t('header_login')}
                        </Link>
                        <Link href="/signup" className="btn btn-primary header-signup">
                           {t('inscription_button')}
                        </Link>
                     </div>
                  )}

                  <button
                     className="menu-button"
                     onClick={() => setMenuOpen(true)}
                     aria-label="Open menu"
                     aria-expanded={isMenuOpen}
                     aria-controls="mobile-menu"
                  >
                     <img draggable="false" src="/images/menu.png" alt="Menu" />
                  </button>
               </div>
            </div>
         </header>

         {isMenuOpen && (
            <div className="mobile-menu-overlay" onClick={closeMenu}>
               <nav className="mobile-menu" id="mobile-menu" onClick={(e) => e.stopPropagation()} aria-label="Mobile navigation">
                  <button className="exit-button" onClick={closeMenu} aria-label="Close menu">
                     <img draggable="false" src="/images/exit.png" alt="Close" />
                  </button>
                   <Link href="/" onClick={closeMenu}>{t('header_home')}</Link>
                   <Link href="/expats" onClick={closeMenu}>{t('header_expats')}</Link>
                   <Link href="/pricing" onClick={closeMenu}>{t('header_pricing')}</Link>
                   <Link href="/about" onClick={closeMenu}>{t('header_about')}</Link>
                  {user && <Link href="/messages" onClick={closeMenu}>{t('header_chat')}</Link>}
                  {user?.type === 'admin' && (
                     <Link href="/admin" onClick={closeMenu}>{t('header_admin_panel')}</Link>
                  )}
                  <div className="mobile-menu-footer">
                     <div className="mobile-theme-row">
                        <span className="mobile-lang-title">{t('language_settings')}</span>
                        <ThemeToggle />
                     </div>
                     <span className="mobile-lang-title">🌐 {t('language_settings')}</span>
                     <div className="mobile-lang-grid">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                           <button
                              key={lang.code}
                              className={`mobile-lang-item ${lang.code === activeLang.code ? 'active' : ''}`}
                              onClick={() => selectLanguage(lang.code)}
                           >
                              {lang.label}
                           </button>
                        ))}
                     </div>
                     {user ? (
                        <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(true)}>
                           {t('header_logout')}
                        </button>
                     ) : (
                        <>
                           <Link href="/login" className="btn btn-secondary" onClick={closeMenu}>
                              {t('header_login')}
                           </Link>
                           <Link href="/signup" className="btn btn-primary" onClick={closeMenu}>
                              {t('inscription_button')}
                           </Link>
                        </>
                     )}
                  </div>
               </nav>
            </div>
         )}

         {showLogoutConfirm && (
            <div className="logout-confirm-overlay" onClick={cancelLogout} role="dialog" aria-modal="true">
               <div className="logout-confirm-popup" onClick={(e) => e.stopPropagation()}>
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
      </>
   );
};

export default Header;