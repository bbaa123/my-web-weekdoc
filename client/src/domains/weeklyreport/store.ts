import { create } from 'zustand';
import type { WeeklyReport, ReportFormData } from './types';

interface WeeklyReportState {
  reports: WeeklyReport[];
  loading: boolean;
  error: string | null;
  setReports: (reports: WeeklyReport[]) => void;
  updateReportStatus: (
    reportId: string,
    patch: Partial<Pick<WeeklyReport, 'status' | 'feedback' | 'feedbackAt' | 'submittedAt'>>
  ) => void;
  addReport: (data: ReportFormData, authorName: string) => void;
}

export const useWeeklyReportStore = create<WeeklyReportState>()((set) => ({
  reports: [],
  loading: false,
  error: null,

  setReports: (reports) => set({ reports }),

  updateReportStatus: (reportId, patch) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId ? { ...r, ...patch } : r
      ),
    })),

  addReport: (data, authorName) =>
    set((state) => {
      const now = new Date().toISOString();
      const newReport: WeeklyReport = {
        id: String(Date.now()),
        authorId: 'me',
        authorName,
        weekStart: now.slice(0, 10),
        status: '제출 완료',
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      return { reports: [newReport, ...state.reports] };
    }),
}));
