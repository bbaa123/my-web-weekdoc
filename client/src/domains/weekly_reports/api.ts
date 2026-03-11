import { apiClient } from '@/core/api/client';
import type {
  AISummarizeResponse,
  AIGuideResponse,
  TeamWeeklyReport,
  WeeklyReport,
  WeeklyReportComment,
  WeeklyReportCommentCreate,
  WeeklyReportCommentUpdate,
  WeeklyReportCreate,
  WeeklyReportUpdate,
} from './types';

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

// ─── AI API ───────────────────────────────────────────────────────────────────

export async function aiSummarize(no: number): Promise<AISummarizeResponse> {
  const response = await apiClient.post<AISummarizeResponse>(
    `/api/v1/weekly-reports/${no}/ai/summarize`
  );
  return response.data;
}

export async function aiGuide(no: number): Promise<AIGuideResponse> {
  const response = await apiClient.post<AIGuideResponse>(
    `/api/v1/weekly-reports/${no}/ai/guide`
  );
  return response.data;
}

export async function aiGuideText(thisWeek: string): Promise<AIGuideResponse> {
  const response = await apiClient.post<AIGuideResponse>(
    '/api/v1/weekly-reports/ai/guide-text',
    { this_week: thisWeek }
  );
  return response.data;
}

// ─── 댓글 API ─────────────────────────────────────────────────────────────────

export async function fetchComments(reportNo: number): Promise<WeeklyReportComment[]> {
  const response = await apiClient.get<WeeklyReportComment[]>(
    `/api/v1/weekly-reports/${reportNo}/comments`
  );
  return response.data;
}

export async function createComment(
  reportNo: number,
  data: WeeklyReportCommentCreate
): Promise<WeeklyReportComment> {
  const response = await apiClient.post<WeeklyReportComment>(
    `/api/v1/weekly-reports/${reportNo}/comments`,
    data
  );
  return response.data;
}

export async function updateComment(
  commentId: number,
  data: WeeklyReportCommentUpdate
): Promise<WeeklyReportComment> {
  const response = await apiClient.put<WeeklyReportComment>(
    `/api/v1/weekly-reports/comments/${commentId}`,
    data
  );
  return response.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/api/v1/weekly-reports/comments/${commentId}`);
}
