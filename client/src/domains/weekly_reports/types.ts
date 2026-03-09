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
}

export interface WeeklyReportCreate {
  year: string;
  month: string;
  week_number: string;
  company?: string;
  work_type?: string;
  project_name?: string;
  this_week?: string;
  next_week?: string;
  progress: number;
  priority?: string;
  issues?: string;
  status?: string;
}
