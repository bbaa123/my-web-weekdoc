/**
 * Users 도메인 API 모듈
 */

import { apiClient } from '@/core/api/client';
import type { ChangePasswordRequest, PresenceUser, UserProfile, UserUpsertRequest } from './types';

export async function getUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/api/v1/login-auth/profile');
  return res.data;
}

export async function upsertUserProfile(data: UserUpsertRequest): Promise<UserProfile> {
  const res = await apiClient.put<UserProfile>('/api/v1/login-auth/profile', data);
  return res.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/api/v1/login-auth/change-password', data);
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const res = await apiClient.get<UserProfile[]>('/api/v1/login-auth/users');
  return res.data;
}

export async function adminUpdateUser(userId: string, data: UserUpsertRequest): Promise<UserProfile> {
  const res = await apiClient.put<UserProfile>(`/api/v1/login-auth/users/${userId}`, data);
  return res.data;
}

/** 로그아웃 시간 기록
 *  fetch keepalive 사용: navigate() 로 페이지 이동 후에도 요청이 완료됨 */
export function callLogoutApi(): void {
  const raw = localStorage.getItem('auth-storage');
  const token: string | null = raw ? (JSON.parse(raw)?.state?.token ?? null) : null;
  if (!token) return;

  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api';
  fetch(`${base}/v1/login-auth/logout`, {
    method: 'POST',
    keepalive: true,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

/** 전체 팀원 접속 현황 조회 */
export async function fetchPresence(): Promise<PresenceUser[]> {
  const res = await apiClient.get<PresenceUser[]>('/api/v1/login-auth/presence');
  return res.data;
}
