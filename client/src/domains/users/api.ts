/**
 * Users 도메인 API 모듈
 */

import { apiClient } from '@/core/api/client';
import type { UserProfile, UserUpsertRequest } from './types';

export async function getUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/api/v1/login-auth/profile');
  return res.data;
}

export async function upsertUserProfile(data: UserUpsertRequest): Promise<UserProfile> {
  const res = await apiClient.put<UserProfile>('/api/v1/login-auth/profile', data);
  return res.data;
}
