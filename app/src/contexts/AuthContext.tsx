// app/src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  company: {
    name: string;
    domain: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  companyDomain: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

useEffect(() => {
  // Don't check auth on auth pages
  if (typeof window !== 'undefined') {
    const isAuthPage = window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/register');
    
    if (!isAuthPage) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }
}, []);

const checkAuth = async () => {
  try {
    // Check if token exists first
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data } = await api.get('/auth/profile');
    setUser(data.user);
  } catch (error) {
    // Clear invalid token
    localStorage.removeItem('auth_token');
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    router.push('/dashboard');
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    router.push('/dashboard');
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  const updateProfile = async (updates: any) => {
    const { data } = await api.put('/auth/profile', updates);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};