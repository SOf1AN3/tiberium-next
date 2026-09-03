'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SignupPage() {
   const { t } = useTranslation();
   const { signup, isAuthenticated, isLoading } = useAuth();
   const router = useRouter();
   const searchParams = useSearchParams();
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
   });
   const [error, setError] = useState('');

   const redirectTo = searchParams.get('next') || '/';

   useEffect(() => {
      if (!isLoading && isAuthenticated) {
         router.push(redirectTo);
      }
   }, [isAuthenticated, isLoading, router, redirectTo]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value
      });
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (formData.password !== formData.confirmPassword) {
         setError('Passwords do not match');
         return;
      }

      if (formData.password.length < 6) {
         setError('Password must be at least 6 characters');
         return;
      }

      try {
         await signup(formData.name, formData.email, formData.password);
         router.push('/');
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Signup failed');
      }
   };

   return (
      <div className="auth-page">
         <main className="auth-card">
            <form onSubmit={handleSubmit}>
               <h1>{t('inscription_title')}</h1>
               {error && <div className="error-message">{error}</div>}
               <input
                  type="text"
                  name="name"
                  className="text-input"
                  placeholder={t('inscription_name_placeholder')}
                  value={formData.name}
                  onChange={handleChange}
               />
               <input
                  type="email"
                  name="email"
                  className="text-input"
                  placeholder={t('inscription_email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
               />
               <input
                  type="password"
                  name="password"
                  className="text-input"
                  placeholder={t('inscription_password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
               />
               <input
                  type="password"
                  name="confirmPassword"
                  className="text-input"
                  placeholder={t('inscription_confirm_password_placeholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
               />
               <button type="submit" className="btn btn-primary auth-submit">
                  {t('inscription_button')}
               </button>
               <div className="auth-link">
                  {t('inscription_login_link')}{' '}
                  <Link href="/login">{t('connexion_title')}</Link>
               </div>
            </form>
         </main>
      </div>
   );
}