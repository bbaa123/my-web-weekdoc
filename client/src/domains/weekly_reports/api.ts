import { apiClient } from '@/core/api/client';
import type { WeeklyReport, WeeklyReportCreate } from './types';

export async function fetchWeeklyReports(): Promise<WeeklyReport[]> {
  const response = await apiClient.get<WeeklyReport[]>('/api/v1/weekly-reports');
  return response.data;
}

export async function createWeeklyReport(data: WeeklyReportCreate): Promise<WeeklyReport> {
  const response = await apiClient.post<WeeklyReport>('/api/v1/weekly-reports', data);
  return response.data;
}
