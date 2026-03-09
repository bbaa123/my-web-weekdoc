import { apiClient } from '@/core/api/client';
import type { TeamWeeklyReport, WeeklyReport, WeeklyReportCreate, WeeklyReportUpdate } from './types';

export async function fetchWeeklyReports(): Promise<WeeklyReport[]> {
  const response = await apiClient.get<WeeklyReport[]>('/api/v1/weekly-reports');
  return response.data;
}

export async function fetchTeamReports(department?: string): Promise<TeamWeeklyReport[]> {
  const params = department ? { department } : {};
  const response = await apiClient.get<TeamWeeklyReport[]>('/api/v1/weekly-reports/team', {
    params,
  });
  return response.data;
}

export async function createWeeklyReports(data: WeeklyReportCreate[]): Promise<WeeklyReport[]> {
  const response = await apiClient.post<WeeklyReport[]>('/api/v1/weekly-reports', data);
  return response.data;
}

export async function updateWeeklyReport(
  no: number,
  data: WeeklyReportUpdate
): Promise<WeeklyReport> {
  const response = await apiClient.put<WeeklyReport>(`/api/v1/weekly-reports/${no}`, data);
  return response.data;
}

export async function deleteWeeklyReport(no: number): Promise<void> {
  await apiClient.delete(`/api/v1/weekly-reports/${no}`);
}
