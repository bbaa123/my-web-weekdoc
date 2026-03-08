export type WorkType = '일반' | '프로젝트' | '지원' | '기타';
export type Priority = '상' | '중' | '하';
export type ReportStatus = '작성 중' | '제출 완료' | '피드백 도착';

export interface WeeklyReport {
  id: string;
  authorId: string;
  authorName: string;
  weekStart: string;
  workType: WorkType;
  projectName?: string;
  summary: string;
  progress: number;
  priority: Priority;
  issues?: string;
  status: ReportStatus;
  submittedAt?: string;
  feedback?: string;
  feedbackAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFormData {
  workType: WorkType;
  projectName?: string;
  summary: string;
  progress: number;
  priority: Priority;
  issues?: string;
}

export interface QuickFeedbackData {
  reportId: string;
  comment?: string;
}

export interface NoticeItem {
  id: number;
  authorId: number;
  authorName: string;
  seqNo: number;
  content: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeCreateData {
  content: string;
  start_at: string;
  end_at: string;
}
