/**
 * Notice Store
 * 공지사항 전역 상태 관리 (Zustand)
 * - 유효한 공지 목록을 전역으로 공유하여 NoticePanel ↔ NoticeBar 실시간 연동
 */

import { create } from 'zustand';
import { fetchActiveNotices } from './api';
import type { Notice } from './types';

interface NoticeState {
  notices: Notice[];
  isDismissed: boolean;
  refresh: () => Promise<void>;
  addNotice: (notice: Notice) => void;
  removeNotice: (noticeId: number) => void;
  dismiss: () => void;
  show: () => void;
}

export const useNoticeStore = create<NoticeState>((set) => ({
  notices: [],
  isDismissed: false,

  refresh: async () => {
    try {
      const data = await fetchActiveNotices();
      set({ notices: data, isDismissed: false });
    } catch {
      // silent fail — API 오류 시 기존 상태 유지
    }
  },

  addNotice: (notice) =>
    set((state) => ({
      notices: [...state.notices, notice],
      isDismissed: false,
    })),

  removeNotice: (noticeId) =>
    set((state) => ({
      notices: state.notices.filter((n) => n.notice_id !== noticeId),
    })),

  dismiss: () => set({ isDismissed: true }),

  show: () => set({ isDismissed: false }),
}));
