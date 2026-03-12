// 직급 옵션 (5단계)
export const POSITION_OPTIONS = ['임원', '실장', '센터장', '팀장', '매니저'] as const;
export type Position = (typeof POSITION_OPTIONS)[number];

export interface WeeklyReport {
  weekly_reports_no: number;
  id: string;
  year: string;
  month: string;
  week_number: string;
  company: string | null;
  work_type: string | null;
  project_name: string | null;
  this_week: string | null;
  next_week: string | null;
  progress: number;
  priority: string | null;
  issues: string | null;
  status: string | null;
  submitted_at: string | null;
  feedback: string | null;
  summary: string | null;
  due_date: string | null; // 완료 예정일 (YYYY-MM-DD)
}

export interface AISummarizeResponse {
  summary: string;
  weekly_reports_no: number;
}

export interface AIGuideResponse {
  guide: string;
}

export interface AIGuideRequest {
  this_week: string;
}

export interface WeeklyReportCreate {
  year: string;
  month: string;
  week_number: string;
  company: string | null;
  work_type: string | null;
  project_name: string | null;
  this_week: string | null;
  next_week: string | null;
  progress: number;
  priority: string | null;
  issues: string | null;
  status: string | null;
  due_date: string | null; // 완료 예정일 (YYYY-MM-DD)
}

export interface WeeklyReportUpdate {
  year?: string;
  month?: string;
  week_number?: string;
  company?: string | null;
  work_type?: string | null;
  project_name?: string | null;
  this_week?: string | null;
  next_week?: string | null;
  progress?: number;
  priority?: string | null;
  issues?: string | null;
  status?: string | null;
  due_date?: string | null; // 완료 예정일 (YYYY-MM-DD)
}

export interface TeamWeeklyReport extends WeeklyReport {
  author_name: string;
  department: string | null;
}

export interface WeeklyReportComment {
  comment_id: number;
  weekly_reports_no: number;
  id: string;
  commenter_name: string;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  updated_at: string;
  replies: WeeklyReportComment[];
}

export interface DeptStatItem {
  dept: string;
  completed: number;
  total: number;
  delayed: number; // 지연 건수
}

export interface DelayedItem {
  weekly_reports_no: number;
  author_name: string;
  department: string | null;
  project_name: string | null;
  due_date: string; // YYYY-MM-DD
  status: string | null;
  days_overdue: number; // 양수: 지연일수, 0: 오늘마감
}

export interface AICenterBriefingResponse {
  briefing: string;
  total_reports: number;
  status_stats: Record<string, number>;
  dept_stats: DeptStatItem[];
  delayed_items: DelayedItem[];
}

export interface AICenterBriefingRequest {
  year: string;
  month: string;
  week_number: string;
  department?: string | null;
}

export interface WeeklyReportCommentCreate {
  content: string;
  parent_comment_id?: number | null;
}

export interface WeeklyReportCommentUpdate {
  content: string;
}

export interface SendReportEmailRequest {
  recipients: string[];
  pdf_base64: string;
  year: string;
  month: string;
  week_number: string;
  dept_name: string;
  delayed_items?: DelayedItem[];
}

export interface SendReportEmailResponse {
  success: boolean;
  message: string;
}

// ── 지연 상태 판별 유틸 ──────────────────────────────────────────────────────

export type DueDateStatus = 'overdue' | 'today' | 'normal' | 'none';

/**
 * due_date 기준 지연 상태 반환
 * - 'overdue': 완료 예정일이 지났고 완료 상태 아님
 * - 'today': 오늘이 완료 예정일이고 완료 상태 아님
 * - 'normal': 아직 기한 내
 * - 'none': due_date 없음
 */
export function getDueDateStatus(
  due_date: string | null,
  status: string | null
): DueDateStatus {
  if (!due_date) return 'none';
  const COMPLETED = new Set(['완료', 'COMPLETED']);
  if (status && COMPLETED.has(status)) return 'normal';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(due_date);
  due.setHours(0, 0, 0, 0);

  const diff = today.getTime() - due.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return 'overdue';
  if (days === 0) return 'today';
  return 'normal';
}
