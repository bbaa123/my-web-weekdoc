/**
 * ReportsPage - AI 통합 요약 중심의 센터 주간 보고서 화면
 *
 * - 상단: AI 센터 종합 브리핑 (3대 성과 / 리스크 / 조직 관리 제언)
 * - 중단: 업무 상태 분포 + 부서별 완료율 차트 (recharts)
 * - 하단: 개별 보고서 아코디언 (접이식)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  CalendarDays,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Grid3X3,
  Layers,
  Zap,
  Loader2,
  Users,
  FileDown,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { getCurrentWeekInfo } from '@/core/utils/date';
import { NoticeBar, NOTICE_BAR_HEIGHT } from '@/domains/notice/components/NoticeBar';
import { useNoticeStore } from '@/domains/notice/store';
import { fetchAccessibleDepartments } from '@/domains/departments/api';
import type { Department } from '@/domains/departments/types';
import { fetchTeamReports, aiCenterBriefing } from '../api';
import type { AICenterBriefingResponse, TeamWeeklyReport } from '../types';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const YEAR_OPTIONS = ['2026', '2027', '2028', '2029', '2030'];
const MONTH_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const WEEK_OPTIONS = ['1주차', '2주차', '3주차', '4주차', '5주차'];

const STATUS_COLORS: Record<string, string> = {
  완료: '#10b981',
  진행: '#3b82f6',
  중단: '#ef4444',
  COMPLETED: '#10b981',
  'IN PROGRESS': '#3b82f6',
  PENDING: '#3b82f6',
  DELAYED: '#ef4444',
  미지정: '#94a3b8',
};

const STATUS_DISPLAY: Record<string, string> = {
  완료: '완료',
  진행: '진행',
  중단: '중단',
  COMPLETED: '완료',
  'IN PROGRESS': '진행',
  PENDING: '진행',
  DELAYED: '중단',
  미지정: '미지정',
};

// ─── 브리핑 파서 ──────────────────────────────────────────────────────────────

interface BriefingStep {
  stepNumber: number;
  title: string;
  items: string[];
  rawContent: string;
}

function parseBriefing(briefing: string): BriefingStep[] {
  const steps: BriefingStep[] = [];
  const re = /##Step\s*(\d+)[:\s]+(.+)/gi;
  const headers: { index: number; stepNum: number; title: string }[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(briefing)) !== null) {
    headers.push({ index: m.index, stepNum: parseInt(m[1]), title: m[2].trim() });
  }

  for (let i = 0; i < headers.length; i++) {
    const headerEnd = briefing.indexOf('\n', headers[i].index);
    const contentStart = headerEnd >= 0 ? headerEnd + 1 : briefing.length;
    const contentEnd = i + 1 < headers.length ? headers[i + 1].index : briefing.length;
    const rawContent = briefing.slice(contentStart, contentEnd).trim();
    const items = rawContent
      .split('\n')
      .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter((l) => l.length > 0);

    steps.push({ stepNumber: headers[i].stepNum, title: headers[i].title, items, rawContent });
  }

  // 파싱 실패 시 원문을 단일 스텝으로 표시
  if (steps.length === 0) {
    const items = briefing
      .split('\n')
      .map((l) => l.replace(/^[##•\-\*]\s*/, '').trim())
      .filter((l) => l.length > 0);
    steps.push({ stepNumber: 1, title: '팀 종합 브리핑', items, rawContent: briefing });
  }

  return steps;
}

const BADGE_COLORS: Record<string, string> = {
  '🔵': 'bg-blue-100 text-blue-700',
  '🟢': 'bg-green-100 text-green-700',
  '🟡': 'bg-yellow-100 text-yellow-700',
  '🔴': 'bg-red-100 text-red-700',
};

function parseNameBadges(text: string): { name: string; emoji: string; colorClass: string }[] {
  const badges: { name: string; emoji: string; colorClass: string }[] = [];
  const re = /([🔵🟢🟡🔴])\s*([가-힣a-zA-Z0-9]+)/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    badges.push({
      emoji: match[1],
      name: match[2],
      colorClass: BADGE_COLORS[match[1]] ?? 'bg-slate-100 text-slate-700',
    });
  }
  return badges;
}

// ─── 개별 보고서 아코디언 아이템 ──────────────────────────────────────────────

interface AccordionItemProps {
  report: TeamWeeklyReport;
  index: number;
}

function AccordionItem({ report, index }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  const statusColor = STATUS_COLORS[report.status || '미지정'] || '#94a3b8';
  const statusLabel = STATUS_DISPLAY[report.status || ''] || report.status || '미지정';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}</span>
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="text-sm font-semibold text-slate-800 truncate">
            {report.author_name || report.id}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{report.department || '부서미지정'}</span>
          {report.project_name && (
            <span className="text-xs text-slate-500 truncate hidden sm:block">
              · {report.project_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {statusLabel}
          </span>
          <span className="text-xs text-slate-400">{report.progress}%</span>
          {open ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
          {report.this_week && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">금주 진행 사항</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.this_week}
              </p>
            </div>
          )}
          {report.next_week && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">차주 계획</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {report.next_week}
              </p>
            </div>
          )}
          {report.issues && (
            <div>
              <p className="text-xs font-bold text-red-500 mb-1">이슈 / 리스크</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed bg-red-50 rounded-lg p-2">
                {report.issues}
              </p>
            </div>
          )}
          {!report.this_week && !report.next_week && !report.issues && (
            <p className="text-sm text-slate-400 italic">내용 없음</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function ReportsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notices: barNotices, isDismissed: isBarDismissed } = useNoticeStore();
  const isBarVisible = !isBarDismissed && barNotices.length > 0;

  // 필터 상태
  const { year: currentYear, month: currentMonth, weekNumber: currentWeekNumber } =
    getCurrentWeekInfo();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterWeek, setFilterWeek] = useState(currentWeekNumber);
  const [filterDept, setFilterDept] = useState<string>('');

  // 부서 목록 상태
  const [accessibleDepts, setAccessibleDepts] = useState<Department[]>([]);

  // 보고서 데이터
  const [teamReports, setTeamReports] = useState<TeamWeeklyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // AI 브리핑 상태
  const [briefingData, setBriefingData] = useState<AICenterBriefingResponse | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const briefingRef = useRef<HTMLDivElement>(null);

  // 개별 보고서 섹션 표시 여부
  const [showDetails, setShowDetails] = useState(false);

  const isAdmin = user?.is_admin ?? false;

  // ── 접근 가능 부서 로드 ────────────────────────────────────────────────────
  useEffect(() => {
    fetchAccessibleDepartments()
      .then((depts) => {
        setAccessibleDepts(depts);
        // 초기 선택: 목록의 첫 번째 부서(최상위)
        if (depts.length > 0 && !filterDept) {
          setFilterDept(depts[0].dept_code);
        }
      })
      .catch(() => toast.error('부서 목록을 불러오지 못했습니다.'));
  }, []);

  // ── 팀 보고서 로드 (필터 변경 시) ────────────────────────────────────────
  useEffect(() => {
    if (!filterDept) return;
    setLoadingReports(true);
    fetchTeamReports(filterDept)
      .then((data) => {
        const filtered = data.filter(
          (r) =>
            r.year === filterYear &&
            r.month === filterMonth &&
            r.week_number === filterWeek
        );
        setTeamReports(filtered);
      })
      .catch(() => toast.error('보고서를 불러오지 못했습니다.'))
      .finally(() => setLoadingReports(false));
  }, [filterYear, filterMonth, filterWeek, filterDept]);

  // ── AI 브리핑 생성 ─────────────────────────────────────────────────────────
  const handleGenerateBriefing = async () => {
    if (!filterDept) {
      toast.error('부서를 선택해주세요.');
      return;
    }
    setLoadingBriefing(true);
    setBriefingError(null);
    setBriefingData(null);
    try {
      const result = await aiCenterBriefing({
        year: filterYear,
        month: filterMonth,
        week_number: filterWeek,
        department: filterDept || undefined,
      });
      setBriefingData(result);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : '브리핑 생성에 실패했습니다.';
      setBriefingError(msg);
      toast.error(msg);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportPdf = async () => {
    if (!briefingRef.current) return;
    setExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const canvas = await html2canvas(briefingRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      let y = margin;
      let remaining = imgH;

      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - margin * 2);
        const srcY = (imgH - remaining) * (canvas.height / imgH);
        const srcH = sliceH * (canvas.height / imgH);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, y, imgW, sliceH);
        remaining -= sliceH;
        if (remaining > 0) {
          pdf.addPage();
          y = margin;
        }
      }

      const fileName = `브리핑_${selectedDeptName}_${filterYear}${filterMonth}_${filterWeek}.pdf`;
      pdf.save(fileName);
    } catch {
      toast.error('PDF 내보내기에 실패했습니다.');
    } finally {
      setExportingPdf(false);
    }
  };

  // ── 차트 데이터 ────────────────────────────────────────────────────────────
  const briefingSteps = useMemo(() => {
    if (!briefingData) return [];
    return parseBriefing(briefingData.briefing);
  }, [briefingData]);

  const selectedDeptName =
    accessibleDepts.find((d) => d.dept_code === filterDept)?.dept_name || filterDept;

  // ── 렌더링 ─────────────────────────────────────────────────────────────────
  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-orange-50"
      style={{ paddingTop: isBarVisible ? NOTICE_BAR_HEIGHT : 0 }}
    >
      <NoticeBar />

      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky z-40 bg-white border-b border-slate-100 shadow-sm"
        style={{ top: isBarVisible ? NOTICE_BAR_HEIGHT : 0 }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900">VNTG</span>
              <span className="ml-2 text-xs font-semibold" style={{ color: BRAND }}>
                주간보고
              </span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <button onClick={() => navigate('/weekly-sync')} className="hover:text-slate-700 cursor-pointer">
              Dashboard
            </button>
            <span className="text-slate-900 border-b-2 pb-0.5" style={{ borderColor: BRAND }}>
              Reports
            </span>
            <button onClick={() => navigate('/org-chart')} className="hover:text-slate-700 cursor-pointer">
              Teams
            </button>
            <button onClick={() => navigate('/department-manage')} className="hover:text-slate-700 cursor-pointer">
              Departments
            </button>
            <button onClick={() => navigate('/user-manage')} className="hover:text-slate-700 cursor-pointer">
              Users
            </button>
            <button onClick={() => navigate('/presence')} className="hover:text-slate-700 cursor-pointer">
              Presence
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-page')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all cursor-pointer"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="profile"
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: BRAND }}
                >
                  {(user.nicname || user.name).slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-slate-700">
                {user.nicname || user.name}
              </span>
              {isAdmin && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100"
                  style={{ color: BRAND }}
                >
                  관리자
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── 페이지 타이틀 ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">주간 AI 리포트</h1>
            <p className="text-sm text-slate-500 mt-1">
              팀원들의 주간보고를 AI가 종합 분석하여 브리핑을 생성합니다
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} />
            <span>
              {loadingReports ? '로딩 중...' : `${teamReports.length}명의 보고서`}
            </span>
          </div>
        </div>

        {/* ── 필터 바 ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            {/* 부서 선택 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">부서</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 min-w-[140px]"
              >
                {accessibleDepts.length === 0 ? (
                  <option value="">부서 로딩 중...</option>
                ) : (
                  accessibleDepts.map((d) => (
                    <option key={d.dept_code} value={d.dept_code}>
                      {d.dept_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 연도 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">연도</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>

            {/* 월 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">월</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>{parseInt(m)}월</option>
                ))}
              </select>
            </div>

            {/* 주 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500">주</label>
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {WEEK_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* AI 브리핑 생성 버튼 */}
            <button
              onClick={handleGenerateBriefing}
              disabled={loadingBriefing || !filterDept}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ml-auto"
              style={{ backgroundColor: BRAND }}
            >
              {loadingBriefing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Bot size={16} />
                  AI 브리핑 생성
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── AI 센터 종합 브리핑 ────────────────────────────────────────── */}
        {loadingBriefing && (
          <div className="bg-white rounded-2xl border border-orange-200 p-8 shadow-sm flex flex-col items-center justify-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${BRAND}15` }}
            >
              <Bot size={28} style={{ color: BRAND }} className="animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-800">
                AI가 {teamReports.length}명의 보고서를 분석하고 있습니다...
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {selectedDeptName} · {filterYear}년 {parseInt(filterMonth)}월 {filterWeek}
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: BRAND, animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {briefingError && !loadingBriefing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-700">브리핑 생성 실패</p>
                <p className="text-sm text-red-600 mt-0.5">{briefingError}</p>
              </div>
            </div>
          </div>
        )}

        {briefingData && !loadingBriefing && (
          <div ref={briefingRef} className="space-y-4">
            {/* 브리핑 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND}15` }}
                >
                  <Bot size={22} style={{ color: BRAND }} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    센터 주간 종합 브리핑
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedDeptName} · {filterYear}년 {parseInt(filterMonth)}월 {filterWeek} ·{' '}
                    <span className="font-semibold" style={{ color: BRAND }}>
                      {briefingData.total_reports}명
                    </span>{' '}
                    분석 완료
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
                >
                  AI 생성
                </span>
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {exportingPdf ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <FileDown size={13} />
                  )}
                  {exportingPdf ? 'PDF 생성 중...' : 'Export PDF'}
                </button>
              </div>
            </div>

            {/* Step 1: 팀 전체 컨디션 스냅샷 */}
            {briefingSteps[0] && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-orange-600">
                  <Activity size={18} />
                  <h3 className="text-sm font-black">Step 1 · {briefingSteps[0].title}</h3>
                </div>
                <div className="space-y-1.5">
                  {briefingSteps[0].items.map((item, idx) => (
                    <p key={idx} className="text-sm text-slate-700 leading-relaxed">{item}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: 팀원 이름+상태 매트릭스 */}
            {briefingSteps[1] && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-slate-600">
                  <Grid3X3 size={18} />
                  <h3 className="text-sm font-black text-slate-700">Step 2 · {briefingSteps[1].title}</h3>
                </div>
                {(() => {
                  const badges = parseNameBadges(briefingSteps[1].rawContent);
                  return badges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${badge.colorClass}`}
                        >
                          {badge.emoji} {badge.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {briefingSteps[1].items.map((item, idx) => (
                        <p key={idx} className="text-sm text-slate-700 leading-relaxed">{item}</p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step 3 & Step 4: 두 컬럼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 3: 카테고리별 그룹 요약 */}
              {briefingSteps[2] && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-blue-600">
                    <Layers size={18} />
                    <h3 className="text-sm font-black">Step 3 · {briefingSteps[2].title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {briefingSteps[2].items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 shrink-0 text-blue-400 text-base leading-none">•</span>
                        <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 4: Critical Path */}
              {briefingSteps[3] && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-red-600">
                    <Zap size={18} />
                    <h3 className="text-sm font-black">Step 4 · {briefingSteps[3].title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {briefingSteps[3].items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                        <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Step 5: 관리용 모멘텀 대시보드 */}
            {briefingSteps[4] && (
              <div className="bg-slate-900 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">🚩</span>
                  <h3 className="text-sm font-black text-white">
                    관리용 모멘텀 대시보드
                  </h3>
                  <span className="ml-auto text-xs font-semibold text-slate-400">
                    리소스 투입 비중 · 병목 지점 분석
                  </span>
                </div>
                <div className="space-y-3">
                  {briefingSteps[4].items.map((item, idx) => {
                    const isFireLine = item.startsWith('🔥');
                    const isWarningLine = item.startsWith('⚠️');
                    const isScaleLine = item.startsWith('⚖️');
                    const accent = isFireLine
                      ? 'border-orange-500 bg-orange-950/40'
                      : isWarningLine
                        ? 'border-yellow-500 bg-yellow-950/40'
                        : isScaleLine
                          ? 'border-purple-500 bg-purple-950/40'
                          : 'border-slate-600 bg-slate-800';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 border-l-2 pl-3 py-2 rounded-r-xl ${accent}`}
                      >
                        <span className="text-sm text-slate-100 leading-relaxed">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 전체 데이터 보기 (아코디언) ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700">
                전체 데이터 보기
              </span>
              <span className="text-xs font-semibold text-slate-400">
                ({teamReports.length}건)
              </span>
            </div>
            {showDetails ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>

          {showDetails && (
            <div className="border-t border-slate-100 p-4 space-y-2">
              {loadingReports ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">보고서 로딩 중...</span>
                </div>
              ) : teamReports.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  해당 기간의 보고서가 없습니다.
                </div>
              ) : (
                teamReports.map((report, idx) => (
                  <AccordionItem
                    key={report.weekly_reports_no}
                    report={report}
                    index={idx}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* 브리핑 미생성 상태 안내 */}
        {!briefingData && !loadingBriefing && !briefingError && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${BRAND}10` }}
            >
              <Bot size={32} style={{ color: `${BRAND}80` }} />
            </div>
            <p className="text-base font-bold text-slate-600">
              조회 조건을 선택하고 'AI 브리핑 생성' 버튼을 눌러주세요
            </p>
            <p className="text-sm text-slate-400 mt-2">
              선택한 기간의 팀원 보고서를 AI가 분석하여 종합 브리핑을 생성합니다
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
