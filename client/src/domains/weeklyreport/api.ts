import { apiClient } from '@/core/api';
import type { WeeklyReport, ReportFormData, QuickFeedbackData, NoticeItem, NoticeCreateData } from './types';

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

// Notice API
export const fetchNotices = () =>
  apiClient.get<NoticeItem[]>('/v1/notices');

export const fetchActiveNotices = () =>
  apiClient.get<NoticeItem[]>('/v1/notices/active');

export const createNotice = (data: NoticeCreateData) =>
  apiClient.post<NoticeItem>('/v1/notices', data);

export const deleteNotice = (id: number) =>
  apiClient.delete(`/v1/notices/${id}`);
