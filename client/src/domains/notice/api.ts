/**
 * Notice 도메인 API 모듈
 * apiClient 싱글톤을 통해서만 HTTP 호출
 */

import { apiClient } from '@/core/api/client';
import type { Notice, NoticeCreate } from './types';

export async function fetchActiveNotices(): Promise<Notice[]> {
  const response = await apiClient.get<Notice[]>('/api/v1/notices/active');
  return response.data;
}

export async function createNotice(data: NoticeCreate): Promise<Notice> {
  const response = await apiClient.post<Notice>('/api/v1/notices', data);
  return response.data;
}

export async function deleteNotice(noticeId: number): Promise<void> {
  await apiClient.delete(`/api/v1/notices/${noticeId}`);
}
