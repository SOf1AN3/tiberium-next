'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
   id: string;
   name: string;
   email: string;
   type: 'simple' | 'advanced' | 'premium' | 'admin';
}

interface AuthContextType {
   user: User | null;
   token: string | null;
   isLoading: boolean;
   isAuthenticated: boolean;
   login: (email: string, password: string) => Promise<void>;
   signup: (name: string, email: string, password: string) => Promise<void>;
   logout: () => void;
   checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [token, setToken] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Initialize auth from localStorage
   useEffect(() => {
      const initAuth = async () => {
         const savedToken = localStorage.getItem('token');
         if (savedToken) {
            setToken(savedToken);
            await checkAuthWithToken(savedToken);
         }
         setIsLoading(false);
      };

      initAuth();
   }, []);

   const checkAuthWithToken = async (authToken: string) => {
      try {
         const response = await fetch('/api/auth/check', {
            headers: {
               Authorization: `Bearer ${authToken}`,
            },
         });

         if (response.ok) {
            const data = await response.json();
            setUser(data.user);
         } else {
            setToken(null);
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
         }
      } catch (error) {
         console.error('Auth check failed:', error);
         setToken(null);
         localStorage.removeItem('token');
         document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      }
   };

   const setTokenWithCookie = (newToken: string) => {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      // Set cookie for middleware
      document.cookie = `token=${newToken}; path=/; max-age=604800`; // 7 days
   };

   const login = async (email: string, password: string) => {
      try {
         const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
         });

         if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
         }

         const data = await response.json();
         setTokenWithCookie(data.token);
         setUser(data.user);
      } catch (error) {
         throw error;
      }
   };

   const signup = async (name: string, email: string, password: string) => {
      try {
         const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
         });

         if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
         }

         const data = await response.json();
         setTokenWithCookie(data.token);
         setUser(data.user);
      } catch (error) {
         throw error;
      }
   };

   const logout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
   };

   const checkAuth = async () => {
      if (token) {
         await checkAuthWithToken(token);
      }
   };

   return (
      <AuthContext.Provider
         value={{
            user,
            token,
            isLoading,
            isAuthenticated: !!user,
            login,
            signup,
            logout,
            checkAuth,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const context = useContext(AuthContext);
   if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
}
