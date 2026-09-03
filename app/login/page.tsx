'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
   const { t } = useTranslation();
   const { login, isAuthenticated, isLoading } = useAuth();
   const router = useRouter();
   const searchParams = useSearchParams();
   const [formData, setFormData] = useState({
      email: '',
      password: '',
      rester: false
   });
   const [error, setError] = useState('');

const redirectTo = searchParams.get('next') || '/';

    useEffect(() => {
       if (!isLoading && isAuthenticated) {
          router.push(redirectTo);
       }
    }, [isAuthenticated, isLoading, router, redirectTo]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData({
         ...formData,
         [e.target.name]: value
      });
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
         await login(formData.email, formData.password);
         router.push('/');
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Login failed');
      }
   };

   return (
      <div className="auth-page">
         <main className="auth-card">
            <form onSubmit={handleSubmit}>
               <h1>{t('connexion_title')}</h1>
               {error && <div className="error-message">{error}</div>}
               <input
                  type="email"
                  name="email"
                  className="text-input"
                  placeholder={t('connexion_email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required
               />
               <input
                  type="password"
                  name="password"
                  className="text-input"
                  placeholder={t('connexion_password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
               />
               <div className="rester-container">
                  <input
                     type="checkbox"
                     name="rester"
                     id="rester"
                     className="rester"
                     checked={formData.rester}
                     onChange={handleChange}
                  />
                  <label htmlFor="rester" className="rester-label">
                     {t('connexion_rester_label')}
                  </label>
               </div>
               <button type="submit" className="btn btn-primary auth-submit">
                  {t('connexion_button')}
               </button>
               <div className="auth-link">
                  {t('connexion_signup_link')}{' '}
                  <Link href="/signup">{t('inscription_title')}</Link>
               </div>
            </form>
         </main>
      </div>
   );
}