'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';

export default function SignupPage() {
   const { t } = useTranslation();
   const { signup } = useAuth();
   const router = useRouter();
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
   });
   const [error, setError] = useState('');

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
      } catch (err: any) {
         setError(err.message || 'Signup failed');
      }
   };

   return (
      <>
         <div
            className="background-fixe"
            style={{ backgroundImage: `url('/images/background.jpg')`, opacity: 0.9 }}
         ></div>
         <Header />
         <div className="connexion-container">
            <div className="connexion-form">
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
                  <div className="rester-container">
                     <input type="checkbox" name="rester" id="rester" className="rester" onChange={handleChange} />
                     <label htmlFor="rester" className="rester-label">
                        {t('inscription_rester_label')}
                     </label>
                  </div>
                  <button type="submit">{t('inscription_button')}</button>
                  <Link className="inscrire" href="/login">
                     {t('inscription_login_link')}
                  </Link>
               </form>
            </div>
         </div>
      </>
   );
}
