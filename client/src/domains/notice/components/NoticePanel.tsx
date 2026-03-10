/**
 * NoticePanel - 공지사항 슬라이드 패널 컴포넌트
 *
 * 화면 좌측 고정 버튼 클릭 시 서랍처럼 열리는 패널.
 * 공지사항 목록 조회 및 등록 기능 제공.
 */

import { useEffect, useRef, useState } from 'react';
import { Bell, X, Plus, Calendar, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { fetchActiveNotices, createNotice, deleteNotice } from '../api';
import { useNoticeStore } from '../store';
import type { Notice, NoticeCreate } from '../types';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';
const BRAND_LIGHT = '#FFF3EA';
const BRAND_BORDER = '#FFCBA0';

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function toLocalDateInput(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ─── 공지 카드 서브 컴포넌트 ─────────────────────────────────────────────────

interface NoticeCardProps {
  notice: Notice;
  isAdmin: boolean;
  onDelete: (id: number) => void;
}

function NoticeCard({ notice, isAdmin, onDelete }: NoticeCardProps) {
  return (
    <div
      className="rounded-xl border p-3.5 bg-white hover:shadow-md transition-shadow"
      style={{ borderColor: BRAND_BORDER }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-wrap">
          {notice.content}
        </p>
        {isAdmin && (
          <button
            onClick={() => onDelete(notice.notice_id)}
            className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="공지 삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {formatDate(notice.start_at)} ~ {formatDate(notice.end_at)}
        </span>
        <span className="font-medium" style={{ color: BRAND }}>
          @{notice.id}
        </span>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function NoticePanel() {
  const { user } = useAuthStore();
  const isAdmin = user?.is_admin ?? false;
  const noticeStore = useNoticeStore();

  const [isOpen, setIsOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [content, setContent] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);

  // ── 데이터 로딩 ──────────────────────────────────────────────────────────

  async function loadNotices() {
    setLoading(true);
    try {
      const data = await fetchActiveNotices();
      setNotices(data);
      // 전역 스토어에도 반영하여 NoticeBar와 동기화
      noticeStore.refresh();
    } catch {
      toast.error('공지사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadNotices();
    }
  }, [isOpen]);

  // ── 패널 외부 클릭 시 닫기 ───────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // 트리거 버튼은 패널 외부이지만 별도 처리됨
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── 공지 등록 ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('공지 내용을 입력해주세요.');
      return;
    }

    const payload: NoticeCreate = {
      content: content.trim(),
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
    };

    setSubmitting(true);
    try {
      const created = await createNotice(payload);
      toast.success('공지사항이 등록되었습니다.');
      setContent('');
      setStartAt('');
      setEndAt('');
      // 패널 목록 갱신 + NoticeBar 즉시 반영
      setNotices((prev) => [...prev, created]);
      noticeStore.addNotice(created);
    } catch (err: any) {
      const msg = err?.message || '공지 등록에 실패했습니다.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── 공지 삭제 ────────────────────────────────────────────────────────────

  async function handleDelete(noticeId: number) {
    try {
      await deleteNotice(noticeId);
      toast.success('공지사항이 삭제되었습니다.');
      setNotices((prev) => prev.filter((n) => n.notice_id !== noticeId));
      // NoticeBar에서도 즉시 제거
      noticeStore.removeNotice(noticeId);
    } catch {
      toast.error('공지 삭제에 실패했습니다.');
    }
  }

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── 고정 트리거 버튼 ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed left-0 top-[calc(50%+1rem)] z-40 flex items-center gap-1.5 px-2 py-4 rounded-r-xl font-bold text-white text-xs shadow-lg transition-all hover:pl-3 active:scale-95"
        style={{ backgroundColor: BRAND, writingMode: 'vertical-lr' }}
        title="공지사항 열기"
      >
        <Bell size={14} className="rotate-90" />
        <span>공지사항</span>
      </button>

      {/* ── 슬라이드 패널 오버레이 ───────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 pointer-events-auto" />
        </div>
      )}

      {/* ── 슬라이드 패널 ───────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className="fixed top-0 left-0 h-full z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{
          width: 400,
          backgroundColor: BRAND_LIGHT,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          borderRight: `2px solid ${BRAND_BORDER}`,
        }}
      >
        {/* 패널 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ backgroundColor: BRAND }}
        >
          <div className="flex items-center gap-2 text-white">
            <Bell size={18} />
            <h2 className="text-base font-bold tracking-wide">공지사항</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 패널 내용 (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-4">

          {/* ── 등록 폼 ── */}
          {isAdmin && (
            <section
              className="rounded-2xl border bg-white p-4 shadow-sm"
              style={{ borderColor: BRAND_BORDER }}
            >
              <h3 className="text-sm font-bold mb-3" style={{ color: BRAND }}>
                새 공지 등록
              </h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* Content */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    내용
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    placeholder="공지 내용을 입력하세요..."
                    className="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: BRAND_BORDER,
                      // @ts-ignore - custom property for focus ring
                      '--tw-ring-color': BRAND,
                    }}
                  />
                </div>

                {/* 날짜 선택 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={toLocalDateInput(startAt)}
                      onChange={(e) =>
                        setStartAt(e.target.value ? `${e.target.value}T00:00:00` : '')
                      }
                      className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: BRAND_BORDER }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={toLocalDateInput(endAt)}
                      onChange={(e) =>
                        setEndAt(e.target.value ? `${e.target.value}T23:59:59` : '')
                      }
                      className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: BRAND_BORDER }}
                    />
                  </div>
                </div>

                {/* 작성자 ID (읽기 전용 표시) */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium">작성자:</span>
                  <span
                    className="px-2 py-0.5 rounded-full font-semibold text-white text-[11px]"
                    style={{ backgroundColor: BRAND }}
                  >
                    {user?.login_id ?? user?.email ?? '-'}
                  </span>
                </div>

                {/* 등록 버튼 */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: BRAND }}
                >
                  {submitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Plus size={15} />
                  )}
                  등록
                </button>
              </form>
            </section>
          )}

          {/* ── 공지 목록 ── */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-bold" style={{ color: BRAND }}>
              유효한 공지 ({notices.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <AlertCircle size={28} className="opacity-50" />
                <p className="text-sm">현재 유효한 공지사항이 없습니다.</p>
              </div>
            ) : (
              notices.map((notice) => (
                <NoticeCard
                  key={notice.notice_id}
                  notice={notice}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                />
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
