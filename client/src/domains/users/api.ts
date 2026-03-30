/**
 * Users 도메인 API 모듈
 */

import { apiClient } from '@/core/api/client';
import type { ChangePasswordRequest, UserProfile, UserUpsertRequest } from './types';

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
