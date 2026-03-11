/**
 * Auth Store
 * 인증 상태 관리 (Zustand + persist)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/core/api/client';

export interface User {
  id: number;
  login_id?: string;
  email: string;
  name: string;
  nicname?: string | null;
  picture?: string | null;
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
  loginById: (loginId: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerLoginUser: (data: LoginRegisterData) => Promise<void>;
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

export interface LoginRegisterData {
  id: string;
  name: string;
  email: string;
  password: string;
  admin_yn: boolean;
}

interface LoginUserResponse {
  id: string;
  name: string;
  email: string;
  admin_yn: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await apiClient.post<{ access_token: string; user: User }>(
          '/api/v1/auth/login',
          { email, password }
        );
        const { access_token, user } = response.data;
        set({ user, token: access_token, isAuthenticated: true });
      },

      loginById: async (loginId: string, password: string) => {
        const response = await apiClient.post<{ access_token: string; user: LoginUserResponse }>(
          '/api/v1/login-auth/login',
          { id: loginId, password }
        );
        const { access_token, user } = response.data;
        const mappedUser: User = {
          id: 0,
          login_id: user.id,
          email: user.email,
          name: user.name,
          department: '',
          role: '',
          position: '매니저',
          is_admin: user.admin_yn,
          is_active: true,
        };
        set({ user: mappedUser, token: access_token, isAuthenticated: true });
      },

      register: async (data: RegisterData) => {
        const response = await apiClient.post<{ access_token: string; user: User }>(
          '/api/v1/auth/register',
          data
        );
        const { access_token, user } = response.data;
        set({ user, token: access_token, isAuthenticated: true });
      },

      registerLoginUser: async (data: LoginRegisterData) => {
        const response = await apiClient.post<{ access_token: string; user: LoginUserResponse }>(
          '/api/v1/login-auth/register',
          { ...data, admin_yn: false }
        );
        const { access_token, user } = response.data;
        const mappedUser: User = {
          id: 0,
          login_id: user.id,
          email: user.email,
          name: user.name,
          department: '',
          role: '',
          position: '매니저',
          is_admin: user.admin_yn,
          is_active: true,
        };
        set({ user: mappedUser, token: access_token, isAuthenticated: true });
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
