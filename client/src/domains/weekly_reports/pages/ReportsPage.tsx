/**
 * ReportsPage - AI 통합 요약 중심의 센터 주간 보고서 화면
 *
 * - 상단: AI 센터 종합 브리핑 (3대 성과 / 리스크 / 조직 관리 제언)
 * - 중단: 업무 상태 분포 + 부서별 완료율 차트 (recharts)
 * - 하단: 개별 보고서 아코디언 (접이식)
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  CalendarDays,
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trophy,
  Lightbulb,
  Loader2,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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

interface BriefingSection {
  title: string;
  icon: React.ReactNode;
  items: string[];
  color: string;
  bgColor: string;
}

function parseBriefing(briefing: string): BriefingSection[] {
  const sectionDefs = [
    {
      key: '이번 주 3대 핵심 성과',
      icon: <Trophy size={18} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
    },
    {
      key: '즉시 확인이 필요한 리스크',
      icon: <AlertTriangle size={18} />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
    },
    {
      key: '조직 관리 제언',
      icon: <Lightbulb size={18} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
  ];

  const result: BriefingSection[] = [];

  for (const def of sectionDefs) {
    // ##제목 또는 **제목** 형식 모두 처리
    const headerPattern = new RegExp(
      `(?:##|\\*{1,2})\\s*${def.key}\\s*(?:\\*{1,2})?\\s*\\n([\\s\\S]*?)(?=(?:##|\\*{1,2})\\s*(?:이번 주|즉시 확인|조직 관리)|$)`,
      'i'
    );
    const match = briefing.match(headerPattern);
    const sectionText = match ? match[1].trim() : '';

    const items = sectionText
      .split('\n')
      .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter((line) => line.length > 0);

    result.push({
      title: def.key,
      icon: def.icon,
      items: items.length > 0 ? items : ['내용을 분석 중입니다.'],
      color: def.color,
      bgColor: def.bgColor,
    });
  }

  // 파싱 실패 시 원문을 첫 번째 섹션에 그대로 표시
  const hasContent = result.some((s) => s.items.some((i) => i !== '내용을 분석 중입니다.'));
  if (!hasContent) {
    const lines = briefing
      .split('\n')
      .map((l) => l.replace(/^[##•\-\*]\s*/, '').trim())
      .filter((l) => l.length > 0);
    result[0].items = lines.slice(0, 5);
    result[1].items = lines.slice(5, 8);
    result[2].items = lines.slice(8, 11);
  }

  return result;
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

  // ── 차트 데이터 ────────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    if (!briefingData) return [];
    return Object.entries(briefingData.status_stats).map(([status, count]) => ({
      name: STATUS_DISPLAY[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [briefingData]);

  const barData = useMemo(() => {
    if (!briefingData) return [];
    return briefingData.dept_stats.map((d) => ({
      dept: d.dept.length > 8 ? d.dept.slice(0, 8) + '…' : d.dept,
      완료: d.completed,
      미완료: d.total - d.completed,
      완료율: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));
  }, [briefingData]);

  const briefingSections = useMemo(() => {
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
          <div className="space-y-4">
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
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
              >
                AI 생성
              </span>
            </div>

            {/* 섹션 카드 3개 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {briefingSections.map((section) => (
                <div
                  key={section.title}
                  className={`rounded-2xl border p-5 ${section.bgColor}`}
                >
                  <div className={`flex items-center gap-2 mb-3 ${section.color}`}>
                    {section.icon}
                    <h3 className="text-sm font-black">{section.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className="mt-1 shrink-0 text-base leading-none"
                          style={{ color: BRAND }}
                        >
                          •
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* ── 통계 차트 ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 업무 상태 분포 파이 차트 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-700">업무 상태 분포</h3>
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}건`]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">데이터 없음</p>
                )}
              </div>

              {/* 부서별 완료율 바 차트 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-700">부서별 완료율</h3>
                </div>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={barData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="dept"
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => [`${value}건`]}
                      />
                      <Legend />
                      <Bar dataKey="완료" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="미완료" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">데이터 없음</p>
                )}
              </div>
            </div>
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
