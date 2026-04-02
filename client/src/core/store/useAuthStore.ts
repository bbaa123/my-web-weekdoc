/**
 * Auth Store
 * 인증 상태 관리 (Zustand + persist)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/core/api/client';
import { callLogoutApi } from '@/domains/users/api';

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
  logout: () => Promise<void>;
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
          picture: null,
          nicname: null,
        };
        // 토큰을 먼저 저장해야 이후 프로필 API 호출 시 인증 헤더가 붙음
        set({ user: mappedUser, token: access_token, isAuthenticated: true });

        // 프로필 API로 picture, nicname 등 추가 정보 보완
        try {
          const profileRes = await apiClient.get<{
            picture?: string | null;
            nicname?: string | null;
            name?: string;
            department?: string | null;
          }>('/api/v1/login-auth/profile');
          const profile = profileRes.data;
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  picture: profile.picture ?? null,
                  nicname: profile.nicname ?? null,
                  name: profile.name || state.user.name,
                  department: profile.department || state.user.department,
                }
              : state.user,
          }));
        } catch {
          // 프로필 조회 실패해도 기본 로그인은 유지
        }
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

      logout: async () => {
        try {
          await callLogoutApi();
        } catch {
          // 로그아웃 API 실패해도 클라이언트 상태는 초기화
        }
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
