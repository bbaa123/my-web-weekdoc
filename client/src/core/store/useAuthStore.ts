/**
 * Auth Store
 * 인증 상태 관리 (Zustand + persist)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/core/api/client';

export interface User {
  id: number;
  email: string;
  name: string;
  department: string;
  role: string;
  position: '매니저' | '팀장' | '센터장';
  is_admin: boolean;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface RegisterData {
  name: string;
  department: string;
  email: string;
  role: string;
  position: '매니저' | '팀장' | '센터장';
  is_admin: boolean;
  password: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await apiClient.post<{ access_token: string; user: User }>(
          '/v1/auth/login',
          { email, password }
        );
        const { access_token, user } = response.data;
        set({ user, token: access_token, isAuthenticated: true });
      },

      register: async (data: RegisterData) => {
        const response = await apiClient.post<{ access_token: string; user: User }>(
          '/v1/auth/register',
          data
        );
        const { access_token, user } = response.data;
        set({ user, token: access_token, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
