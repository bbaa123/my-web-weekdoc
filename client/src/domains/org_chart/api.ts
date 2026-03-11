/**
 * Org Chart 도메인 API 모듈
 * apiClient 싱글톤을 통해서만 HTTP 호출
 */

import { apiClient } from '@/core/api/client';
import type { OrgChartDept } from './types';

export async function fetchOrgChart(): Promise<OrgChartDept[]> {
  const response = await apiClient.get<OrgChartDept[]>('/api/v1/departments/org-chart');
  return response.data;
}
