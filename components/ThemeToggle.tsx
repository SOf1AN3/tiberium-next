'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tiberium-theme';

const isDark = () =>
   typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';

const subscribe = (callback: () => void) => {
   window.addEventListener('storage', callback);
   window.addEventListener('tiberium-theme', callback as EventListener);
   return () => {
      window.removeEventListener('storage', callback);
      window.removeEventListener('tiberium-theme', callback as EventListener);
   };
};

const getSnapshot = () => (isDark() ? 'dark' : 'light');
const getServerSnapshot = () => 'light';

const applyAndNotify = (theme: 'light' | 'dark') => {
   const root = document.documentElement;
   if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
   } else {
      root.removeAttribute('data-theme');
   }
   window.localStorage.setItem(STORAGE_KEY, theme);
   window.dispatchEvent(new Event('tiberium-theme'));
};

const ThemeToggle = () => {
   const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

   const toggle = () => applyAndNotify(isDark() ? 'light' : 'dark');

   return (
      <button
         className="theme-toggle"
         onClick={toggle}
         aria-label="Toggle dark mode"
         role="switch"
         aria-checked={theme === 'dark'}
         title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
         <span className="theme-toggle-icons" aria-hidden="true">
            <span className={`theme-icon theme-sun ${theme === 'light' ? 'on' : ''}`}>☀️</span>
            <span className={`theme-icon theme-moon ${theme === 'dark' ? 'on' : ''}`}>🌙</span>
         </span>
      </button>
   );
};

export default ThemeToggle;