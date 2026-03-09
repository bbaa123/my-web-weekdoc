import { apiClient } from '@/core/api/client';
import type { WeeklyReport } from './types';

export async function fetchWeeklyReports(): Promise<WeeklyReport[]> {
  const response = await apiClient.get<WeeklyReport[]>('/api/v1/weekly-reports');
  return response.data;
}
