/**
 * NoticeBar - 상단 글로벌 공지 알림 바
 *
 * 유효한 공지사항(start_at <= 오늘 <= end_at)을 화면 최상단에 표시.
 * 여러 공지가 있으면 4초마다 자동 교체(fade). 수동 좌/우 이동 가능.
 * X 버튼으로 닫을 수 있음.
 */

import { useEffect, useState } from 'react';
import { Bell, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNoticeStore } from '../store';

// ─── 디자인 토큰 ─────────────────────────────────────────────────────────────

const BAR_BG = '#FFF3EA';
const BAR_BORDER = '#FFCBA0';
const BAR_TEXT = '#C24F00';   // 가독성을 위해 브랜드 오렌지보다 약간 어둡게
const BAR_ACCENT = '#FF6B00'; // 카운터 배지, 아이콘

// ─── NoticeBar ────────────────────────────────────────────────────────────────

export function NoticeBar() {
  const { notices, isDismissed, dismiss, refresh } = useNoticeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // 마운트 시 최신 공지 로드
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 4초마다 자동 교체 (복수 공지일 때만)
  useEffect(() => {
    if (notices.length <= 1) return;

    const timer = setInterval(() => {
      setVisible(false);
      const nextTimer = setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % notices.length);
        setVisible(true);
      }, 300);
      return () => clearTimeout(nextTimer);
    }, 4000);

    return () => clearInterval(timer);
  }, [notices.length]);

  // 공지 수가 줄어들어 index 초과 방지
  useEffect(() => {
    if (notices.length > 0 && currentIndex >= notices.length) {
      setCurrentIndex(0);
    }
  }, [notices.length, currentIndex]);

  if (isDismissed || notices.length === 0) return null;

  const current = notices[currentIndex];

  function goTo(index: number) {
    setVisible(false);
    setTimeout(() => {
      setCurrentIndex((index + notices.length) % notices.length);
      setVisible(true);
    }, 200);
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center gap-3 px-4"
      style={{
        backgroundColor: BAR_BG,
        borderBottom: `1px solid ${BAR_BORDER}`,
        minHeight: 44,
      }}
    >
      {/* ── 아이콘 + 레이블 ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Bell size={14} style={{ color: BAR_ACCENT }} />
        <span className="text-xs font-bold tracking-wide" style={{ color: BAR_ACCENT }}>
          공지
        </span>
        {notices.length > 1 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white leading-none"
            style={{ backgroundColor: BAR_ACCENT }}
          >
            {currentIndex + 1}/{notices.length}
          </span>
        )}
      </div>

      {/* ── 구분선 ──────────────────────────────────────────────── */}
      <div
        className="h-4 w-px flex-shrink-0"
        style={{ backgroundColor: BAR_BORDER }}
      />

      {/* ── 공지 내용 (fade 전환) ─────────────────────────────── */}
      <p
        className="flex-1 text-sm font-medium truncate transition-opacity duration-300"
        style={{ color: BAR_TEXT, opacity: visible ? 1 : 0 }}
      >
        {current?.content}
      </p>

      {/* ── 좌/우 탐색 (복수 공지일 때) ──────────────────────── */}
      {notices.length > 1 && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => goTo(currentIndex - 1)}
            className="p-1 rounded transition-colors hover:bg-orange-100"
            style={{ color: BAR_TEXT }}
            title="이전 공지"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            className="p-1 rounded transition-colors hover:bg-orange-100"
            style={{ color: BAR_TEXT }}
            title="다음 공지"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── 닫기 버튼 ─────────────────────────────────────────── */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 p-1 rounded transition-colors hover:bg-orange-100"
        style={{ color: BAR_TEXT }}
        title="공지 닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** NoticeBar 높이 상수 — 상위 레이아웃의 오프셋 계산에 사용 */
export const NOTICE_BAR_HEIGHT = 44;
