import { apiClient } from '@/core/api';
import type { WeeklyReport, ReportFormData, QuickFeedbackData } from './types';

export const fetchReports = () =>
  apiClient.get<WeeklyReport[]>('/v1/weekly-reports');

export const fetchReport = (id: string) =>
  apiClient.get<WeeklyReport>(`/v1/weekly-reports/${id}`);

export const createReport = (data: ReportFormData) =>
  apiClient.post<WeeklyReport>('/v1/weekly-reports', data);

export const updateReport = (id: string, data: Partial<ReportFormData>) =>
  apiClient.patch<WeeklyReport>(`/v1/weekly-reports/${id}`, data);

export const submitReport = (id: string) =>
  apiClient.post<WeeklyReport>(`/v1/weekly-reports/${id}/submit`, {});

export const submitQuickFeedback = (data: QuickFeedbackData) =>
  apiClient.post<WeeklyReport>(`/v1/weekly-reports/${data.reportId}/feedback`, {
    comment: data.comment,
  });
