import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

export type Role = 'patient' | 'doctor' | 'admin';

export type User = {
  id: number;
  email: string;
  role: Role;
  fullName: string;
  phone?: string | null;
  active?: number;
  profile?: { specialty?: string; license?: string; bio?: string } | null;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; edad?: number; genero?: string }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shc_token'));
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const t = localStorage.getItem('shc_token');
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('shc_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('shc_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (body: { email: string; password: string; fullName: string; phone?: string; edad?: number; genero?: string }) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/register', body);
    localStorage.setItem('shc_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('shc_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token, loading, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
}
