import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart2,
  Filter,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  Clock,
  LogOut,
} from 'lucide-react';
import { apiClient } from '@/core/api/client';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import type { WeeklyReport } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  '작성 중': {
    label: '작성 중',
    color: 'bg-slate-100 text-slate-600',
    icon: <Clock size={12} />,
  },
  '제출 완료': {
    label: '제출 완료',
    color: 'bg-emerald-50 text-emerald-700',
    icon: <CheckCircle2 size={12} />,
  },
  '피드백 도착': {
    label: '피드백 도착',
    color: 'bg-indigo-50 text-indigo-700',
    icon: <MessageSquare size={12} />,
  },
};

const PRIORITY_CONFIG: Record<string, string> = {
  상: 'bg-rose-50 text-rose-600 border-rose-200',
  중: 'bg-amber-50 text-amber-600 border-amber-200',
  하: 'bg-slate-50 text-slate-500 border-slate-200',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const WEEKS = Array.from({ length: 53 }, (_, i) => i + 1);

interface ReportFromApi {
  id: number;
  author_id: number;
  author_name: string;
  week_start: string;
  year: number;
  month: number;
  week_number: number;
  work_type: string;
  project_name?: string;
  summary: string;
  progress: number;
  priority: string;
  issues?: string;
  status: string;
  submitted_at?: string;
  feedback?: string;
  feedback_at?: string;
  created_at: string;
  updated_at: string;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [reports, setReports] = useState<ReportFromApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterWeek, setFilterWeek] = useState<number | ''>('');
  const [filterMemberId, setFilterMemberId] = useState<number | ''>('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterYear) params.year = String(filterYear);
      if (filterMonth) params.month = String(filterMonth);
      if (filterWeek) params.week_number = String(filterWeek);
      if (filterMemberId && user?.is_admin) params.member_id = String(filterMemberId);

      const query = new URLSearchParams(params).toString();
      const response = await apiClient.get<ReportFromApi[]>(
        `/v1/weekly-reports${query ? `?${query}` : ''}`
      );
      setReports(response.data);
    } catch {
      toast.error('보고서를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = () => {
    fetchReports();
  };

  const handleReset = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterWeek('');
    setFilterMemberId('');
    setTimeout(fetchReports, 0);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const totalReports = reports.length;
  const submittedCount = reports.filter((r) => r.status === '제출 완료' || r.status === '피드백 도착').length;
  const feedbackCount = reports.filter((r) => r.status === '피드백 도착').length;
  const avgProgress =
    reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.progress, 0) / reports.length)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/report"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={15} />
              보고서 작성
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <BarChart2 size={18} />
              전체 보고서 현황
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-600 font-medium">
                {user.name}{' '}
                <span className="text-slate-400 font-normal">({user.position})</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-black text-slate-900">{totalReports}</p>
            <p className="text-sm text-slate-500 mt-1">전체 보고서</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-black text-emerald-600">{submittedCount}</p>
            <p className="text-sm text-slate-500 mt-1">제출 완료</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-black text-indigo-600">{feedbackCount}</p>
            <p className="text-sm text-slate-500 mt-1">피드백 도착</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
            <p className="text-3xl font-black text-amber-600">{avgProgress}%</p>
            <p className="text-sm text-slate-500 mt-1">평균 진도율</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-700">
            <Filter size={16} />
            조회 조건
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 년도 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">년도</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
              >
                <option value="">전체 년도</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            {/* 월 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">월</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
              >
                <option value="">전체 월</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            {/* 주차 */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">주차</label>
              <select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
              >
                <option value="">전체 주차</option>
                {WEEKS.map((w) => (
                  <option key={w} value={w}>
                    {w}주차
                  </option>
                ))}
              </select>
            </div>

            {/* 멤버 (관리자용) */}
            {user?.is_admin && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  멤버 ID (관리자)
                </label>
                <input
                  type="number"
                  value={filterMemberId}
                  onChange={(e) =>
                    setFilterMemberId(e.target.value ? Number(e.target.value) : '')
                  }
                  placeholder="멤버 ID"
                  min={1}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60"
            >
              <Filter size={14} />
              조회
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 보고서 목록 */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 text-slate-400">
              불러오는 중...
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 space-y-3">
              <ClipboardList size={32} className="text-slate-300 mx-auto" />
              <p className="text-slate-400 text-sm">조회된 보고서가 없습니다.</p>
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-all"
              >
                보고서 작성하기
              </Link>
            </div>
          ) : (
            reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG['작성 중'];
              const priorityCls = PRIORITY_CONFIG[report.priority] ?? PRIORITY_CONFIG['중'];
              const weekDate = new Date(report.week_start);
              const weekLabel = `${report.year}년 ${report.month}월 ${report.week_number}주차`;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 상단: 주차 정보 + 상태 */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        {weekDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        주
                      </p>
                      <p className="font-bold text-slate-900 text-lg">{weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityCls}`}
                      >
                        {report.priority}
                      </span>
                    </div>
                  </div>

                  {/* 업무 유형 + 프로젝트명 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                      {report.work_type}
                    </span>
                    {report.project_name && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg">
                        {report.project_name}
                      </span>
                    )}
                    {user?.is_admin && (
                      <span className="ml-auto text-xs text-slate-400">{report.author_name}</span>
                    )}
                  </div>

                  {/* 업무 내용 */}
                  <p className="text-sm text-slate-700 leading-relaxed mb-3 line-clamp-3">
                    {report.summary}
                  </p>

                  {/* 진도율 바 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>진도율</span>
                      <span className="font-semibold">{report.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${report.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 이슈 */}
                  {report.issues && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-2">
                      <span className="font-semibold">이슈:</span> {report.issues}
                    </p>
                  )}

                  {/* 피드백 */}
                  {report.feedback && (
                    <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-700 mb-1">피드백</p>
                      <p className="text-xs text-indigo-600">{report.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
