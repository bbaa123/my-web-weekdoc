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
  due_date: string | null;
  parent_id: number | null;
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
  due_date: string | null;
  parent_id?: number | null;
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
  due_date?: string | null;
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
}

export interface AICenterBriefingResponse {
  briefing: string;
  total_reports: number;
  status_stats: Record<string, number>;
  dept_stats: DeptStatItem[];
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
