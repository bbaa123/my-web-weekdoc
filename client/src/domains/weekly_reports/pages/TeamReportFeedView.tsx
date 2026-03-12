import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCheck,
  Users,
  AlertTriangle,
  FileX,
  Loader2,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { cn } from '@/core/utils/cn';
import { fetchTeamReports } from '../api';
import type { TeamWeeklyReport } from '../types';
import { WeeklyReportComments } from '../components/WeeklyReportComments';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const HIGHLIGHT_KEYWORDS = ['지연', '장애', '이슈', '문제', '위험'];

const STATUS_DISPLAY: Record<string, { label: string; cls: string; dotCls: string }> = {
  진행: { label: '진행', cls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  중단: { label: '중단', cls: 'bg-red-100 text-red-600', dotCls: 'bg-red-500' },
  완료: { label: '완료', cls: 'bg-emerald-100 text-emerald-700', dotCls: 'bg-emerald-500' },
  COMPLETED: { label: '완료', cls: 'bg-emerald-100 text-emerald-700', dotCls: 'bg-emerald-500' },
  'IN PROGRESS': { label: '진행', cls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  PENDING: { label: '진행', cls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  DELAYED: { label: '중단', cls: 'bg-red-100 text-red-600', dotCls: 'bg-red-500' },
  진행중: { label: '진행', cls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  대기: { label: '진행', cls: 'bg-blue-100 text-blue-700', dotCls: 'bg-blue-500' },
  지연: { label: '중단', cls: 'bg-red-100 text-red-600', dotCls: 'bg-red-500' },
  보류: { label: '중단', cls: 'bg-red-100 text-red-600', dotCls: 'bg-red-500' },
  취소: { label: '중단', cls: 'bg-red-100 text-red-600', dotCls: 'bg-red-500' },
};

// ─── 필터 타입 ────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'stopped' | 'not-submitted';

// ─── 유틸: 키워드 하이라이트 ──────────────────────────────────────────────────

function HighlightedText({ text }: { text: string }) {
  if (!text) return null;

  const pattern = new RegExp(`(${HIGHLIGHT_KEYWORDS.join('|')})`, 'g');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        HIGHLIGHT_KEYWORDS.includes(part) ? (
          <mark
            key={i}
            className="bg-orange-200 text-orange-800 rounded px-0.5 font-semibold not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── 유틸: 진행률 바 ──────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const barColor =
    value <= 30 ? 'bg-red-400' : value <= 70 ? 'bg-yellow-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-500">{value}%</span>
    </div>
  );
}

// ─── 유틸: 상태 배지 ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
        미제출
      </span>
    );
  }
  const mapped = STATUS_DISPLAY[status];
  if (!mapped)
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        {status}
      </span>
    );
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${mapped.cls}`}>
      {mapped.label}
    </span>
  );
}

// ─── 사이드바 항목 ────────────────────────────────────────────────────────────

interface SidebarMember {
  id: string;
  name: string;
  status: string | null;
  reportNo: number;
  submitted: boolean;
}

function SidebarItem({
  member,
  isActive,
  onClick,
}: {
  member: SidebarMember;
  isActive: boolean;
  onClick: () => void;
}) {
  const mapped = member.status ? STATUS_DISPLAY[member.status] : null;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all',
        isActive ? 'bg-orange-50 border border-orange-200' : 'hover:bg-slate-50'
      )}
    >
      {/* 아바타 */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: BRAND }}
      >
        {member.name.slice(0, 1)}
      </div>

      <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{member.name}</span>

      {/* 상태 도트 */}
      {!member.submitted ? (
        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="미제출" />
      ) : mapped ? (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${mapped.dotCls}`}
          title={mapped.label}
        />
      ) : (
        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
      )}
    </button>
  );
}

// ─── 보고서 카드 ──────────────────────────────────────────────────────────────

interface ReportCardProps {
  report: TeamWeeklyReport;
  isRead: boolean;
  onMarkRead: (no: number) => void;
}

function ReportCard({ report, isRead, onMarkRead }: ReportCardProps) {
  const hasIssueKeyword = HIGHLIGHT_KEYWORDS.some(
    (kw) =>
      report.this_week?.includes(kw) ||
      report.next_week?.includes(kw) ||
      report.issues?.includes(kw)
  );

  return (
    <div
      id={`report-card-${report.weekly_reports_no}`}
      className={cn(
        'bg-white rounded-2xl border transition-all shadow-sm',
        hasIssueKeyword
          ? 'border-orange-300 shadow-orange-100'
          : isRead
          ? 'border-slate-100 opacity-90'
          : 'border-slate-200'
      )}
    >
      {/* ── 카드 헤더 요약 줄 ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
        {/* 아바타 + 이름 */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: BRAND }}
          >
            {report.author_name.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-tight">{report.author_name}</p>
            {report.department && (
              <p className="text-[11px] text-slate-400 leading-tight">{report.department}</p>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* 프로젝트명 */}
        <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">
          {report.project_name || report.work_type || '-'}
        </span>

        <div className="h-4 w-px bg-slate-200" />

        {/* 진행률 */}
        <ProgressBar value={report.progress} />

        <div className="h-4 w-px bg-slate-200" />

        {/* 상태 */}
        <StatusBadge status={report.status} />

        {/* 주차 정보 */}
        <span className="ml-auto text-xs text-slate-400 shrink-0">
          {report.year}년 {report.month}월 {report.week_number}
        </span>

        {/* 이슈 경고 아이콘 */}
        {hasIssueKeyword && (
          <AlertTriangle size={15} className="text-orange-500 shrink-0" title="주의 키워드 포함" />
        )}

        {/* 읽음 처리 */}
        {!isRead && (
          <button
            onClick={() => onMarkRead(report.weekly_reports_no)}
            className="shrink-0 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
            title="읽음 처리"
          >
            <CheckCheck size={15} />
          </button>
        )}
        {isRead && (
          <span className="shrink-0" title="확인 완료">
            <CheckCheck size={15} className="text-emerald-400" />
          </span>
        )}
      </div>

      {/* ── 본문 ─────────────────────────────────────────── */}
      <div className="px-5 py-4 grid md:grid-cols-2 gap-5">
        {/* 이번 주 업무 */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            이번 주 업무
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {report.this_week ? (
              <HighlightedText text={report.this_week} />
            ) : (
              <span className="text-slate-300 italic">미작성</span>
            )}
          </p>
        </div>

        {/* 다음 주 계획 */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            다음 주 계획
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {report.next_week ? (
              <HighlightedText text={report.next_week} />
            ) : (
              <span className="text-slate-300 italic">미작성</span>
            )}
          </p>
        </div>

        {/* 이슈 */}
        {report.issues && (
          <div className="md:col-span-2 rounded-lg bg-orange-50 border border-orange-100 px-4 py-3">
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wider mb-1">
              이슈 / 특이사항
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              <HighlightedText text={report.issues} />
            </p>
          </div>
        )}
      </div>

      {/* ── 댓글 ─────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-5 py-4">
        <WeeklyReportComments reportNo={report.weekly_reports_no} />
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function TeamReportFeedView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [reports, setReports] = useState<TeamWeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [activeCardNo, setActiveCardNo] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    load();
  }, [user]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTeamReports();
      setReports(data);
    } catch {
      toast.error('팀 보고서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ── 필터 로직 ──────────────────────────────────────────
  const filtered = reports.filter((r) => {
    if (filter === 'stopped') return r.status === '중단' || r.status === 'DELAYED' || r.status === '지연';
    if (filter === 'not-submitted') return !r.submitted_at;
    return true;
  });

  // ── 사이드바 멤버 목록 (중복 제거 - 이름 기준) ──────────
  const sidebarMembers: SidebarMember[] = filtered
    .reduce<SidebarMember[]>((acc, r) => {
      if (!acc.find((m) => m.name === r.author_name)) {
        acc.push({
          id: r.id,
          name: r.author_name,
          status: r.status,
          reportNo: r.weekly_reports_no,
          submitted: !!r.submitted_at,
        });
      }
      return acc;
    }, []);

  // ── 읽음 처리 ─────────────────────────────────────────
  const markRead = (no: number) => {
    setReadIds((prev) => new Set([...prev, no]));
  };

  const markAllRead = () => {
    setReadIds(new Set(filtered.map((r) => r.weekly_reports_no)));
    toast.success(`${filtered.length}개 보고서를 모두 확인 완료 처리했습니다.`);
  };

  // ── 스크롤 이동 ───────────────────────────────────────
  const scrollToCard = (reportNo: number) => {
    const el = document.getElementById(`report-card-${reportNo}`);
    if (el && feedRef.current) {
      const offset = el.offsetTop - 80;
      feedRef.current.scrollTo({ top: offset, behavior: 'smooth' });
      setActiveCardNo(reportNo);
    }
  };

  const scrollToTop = () => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── 통계 ──────────────────────────────────────────────
  const totalCount = filtered.length;
  const readCount = filtered.filter((r) => readIds.has(r.weekly_reports_no)).length;
  const stoppedCount = reports.filter(
    (r) => r.status === '중단' || r.status === 'DELAYED' || r.status === '지연'
  ).length;
  const notSubmittedCount = reports.filter((r) => !r.submitted_at).length;

  return (
    <div className="flex h-screen bg-orange-50 overflow-hidden">
      {/* ── 좌측 사이드바 ───────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-100 flex flex-col shadow-sm z-10">
        {/* 사이드바 헤더 */}
        <div className="px-4 py-4 border-b border-slate-100">
          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
          >
            <ArrowLeft size={15} />
            대시보드
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: BRAND }}
            >
              <Users size={14} className="text-white" />
            </div>
            <span className="text-sm font-black text-slate-900">팀 보고서 뷰</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {totalCount}명 · 확인 {readCount}/{totalCount}
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
              filter === 'all' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <span>전체 보기</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {reports.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('stopped')}
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
              filter === 'stopped'
                ? 'bg-red-50 text-red-600'
                : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <span>⏸ 중단 업무</span>
            <span className="rounded-full bg-red-50 text-red-500 px-2 py-0.5">
              {stoppedCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('not-submitted')}
            className={cn(
              'w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
              filter === 'not-submitted'
                ? 'bg-slate-100 text-slate-700'
                : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            <span>📭 미제출</span>
            <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5">
              {notSubmittedCount}
            </span>
          </button>
        </div>

        {/* 팀원 목록 */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : sidebarMembers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">보고서 없음</p>
          ) : (
            sidebarMembers.map((member) => (
              <SidebarItem
                key={`${member.id}-${member.reportNo}`}
                member={member}
                isActive={activeCardNo === member.reportNo}
                onClick={() => scrollToCard(member.reportNo)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── 우측 메인 피드 ──────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 피드 헤더 */}
        <header className="shrink-0 bg-white border-b border-slate-100 shadow-sm px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 타이틀 */}
            <div>
              <h1 className="text-lg font-black text-slate-900">팀 보고서 피드</h1>
              <p className="text-xs text-slate-400">
                {filter === 'all' && `전체 ${totalCount}건`}
                {filter === 'stopped' && `중단 업무 ${totalCount}건`}
                {filter === 'not-submitted' && `미제출 ${totalCount}건`}
              </p>
            </div>

            {/* 필터 칩 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  filter === 'all'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-500'
                )}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('stopped')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  filter === 'stopped'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-500'
                )}
              >
                ⏸ 중단된 업무만
              </button>
              <button
                onClick={() => setFilter('not-submitted')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                  filter === 'not-submitted'
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                )}
              >
                <FileX size={12} />
                미작성자만
              </button>
            </div>

            {/* 모두 읽음 버튼 */}
            <button
              onClick={markAllRead}
              disabled={readCount === totalCount || totalCount === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                readCount === totalCount || totalCount === 0
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500'
              )}
            >
              <CheckCheck size={15} />
              모두 읽음 처리 ({readCount}/{totalCount})
            </button>
          </div>
        </header>

        {/* 피드 본문 */}
        <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: BRAND }} />
              <p className="text-sm text-slate-400">보고서를 불러오는 중...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <FileX size={40} className="text-slate-300" />
              <p className="text-slate-400 font-semibold">해당 조건의 보고서가 없습니다.</p>
            </div>
          ) : (
            filtered.map((report) => (
              <ReportCard
                key={report.weekly_reports_no}
                report={report}
                isRead={readIds.has(report.weekly_reports_no)}
                onMarkRead={markRead}
              />
            ))
          )}
        </div>

        {/* 맨 위로 버튼 */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all z-50"
          >
            <ChevronUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
