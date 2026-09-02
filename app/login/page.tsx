'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';

export default function LoginPage() {
   const { t } = useTranslation();
   const { login } = useAuth();
   const router = useRouter();
   const [formData, setFormData] = useState({
      email: '',
      password: '',
      rester: false
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

      try {
         await login(formData.email, formData.password);
         router.push('/');
      } catch (err: any) {
         setError(err.message || 'Login failed');
      }
   };

   return (
      <div className="connexion-page">
         <div
            className="background-fixe"
            style={{ backgroundImage: `url('/images/background.jpg')`, opacity: 0.9 }}
         ></div>
         <Header />
         <div className="connexion-content">
            <div className="connexion-container">
               <div className="connexion-form">
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
                     <button type="submit">{t('connexion_button')}</button>
                     <Link className="inscrire" href="/signup">
                        {t('connexion_signup_link')}
                     </Link>
                  </form>
               </div>
            </div>
         </div>
      </div>
   );
}
