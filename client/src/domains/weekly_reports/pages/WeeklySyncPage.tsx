import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Shield,
  User,
  Loader2,
  FileText,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { fetchWeeklyReports, createWeeklyReport } from '../api';
import type { WeeklyReport, WeeklyReportCreate } from '../types';

const STATUS_COLOR: Record<string, string> = {
  완료: 'bg-emerald-100 text-emerald-700',
  진행중: 'bg-blue-100 text-blue-700',
  지연: 'bg-rose-100 text-rose-700',
  대기: 'bg-slate-100 text-slate-600',
};

const PRIORITY_COLOR: Record<string, string> = {
  높음: 'bg-rose-50 text-rose-600 border border-rose-200',
  중간: 'bg-amber-50 text-amber-600 border border-amber-200',
  낮음: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const YEARS = ['2026', '2027', '2028', '2029', '2030'];
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const WEEKS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
const PRIORITIES = ['높음', '중간', '낮음'];
const STATUSES = ['대기', '진행중', '완료', '지연'];

const EMPTY_FORM: WeeklyReportCreate = {
  year: '2026',
  month: '03',
  week_number: '1주차',
  company: '',
  work_type: '',
  project_name: '',
  this_week: '',
  next_week: '',
  progress: 0,
  priority: '',
  issues: '',
  status: '',
};

export function WeeklySyncPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WeeklyReportCreate>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadReports();
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklyReports();
      setReports(data);
    } catch {
      toast.error('주간보고를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'progress' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWeeklyReport(form);
      toast.success('주간보고가 등록되었습니다.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadReports();
    } catch {
      toast.error('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.is_admin;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900">Weekly Sync</span>
              <span className="ml-2 text-xs font-semibold text-orange-500">주간보고</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 사용자 정보 */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
              {isAdmin ? (
                <Shield size={14} className="text-orange-500" />
              ) : (
                <User size={14} className="text-slate-500" />
              )}
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              {isAdmin && (
                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full">
                  관리자
                </span>
              )}
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 상단 타이틀 + 등록 버튼 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {isAdmin ? '전체 주간보고 현황' : '내 주간보고'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? '모든 팀원의 주간보고를 확인합니다.'
                : '본인이 등록한 주간보고를 확인합니다.'}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-200"
            >
              <Plus size={16} />
              주간보고 등록
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="animate-spin text-orange-400" size={32} />
            <p className="text-sm text-slate-400">불러오는 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <FileText size={40} className="text-slate-300" />
            <p className="text-slate-400 font-medium">등록된 주간보고가 없습니다.</p>
            {!isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-200"
              >
                <Plus size={16} />
                첫 주간보고 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((r) => (
              <button
                key={r.weekly_reports_no}
                onClick={() => setSelected(r)}
                className="text-left w-full bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-orange-500 mb-1">
                      {r.year}년 {r.month}월 {r.week_number}
                    </p>
                    <p className="font-bold text-slate-900 text-base leading-tight">
                      {r.project_name || '(프로젝트명 없음)'}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <User size={11} />
                        {r.id}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-orange-400 transition-colors shrink-0 mt-0.5"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {r.status && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {r.status}
                    </span>
                  )}
                  {r.priority && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[r.priority] ?? 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                    >
                      우선순위: {r.priority}
                    </span>
                  )}
                  {r.company && (
                    <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {r.company}
                    </span>
                  )}
                </div>

                {/* 진행률 바 */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>진행률</span>
                    <span className="font-semibold text-orange-500">{r.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${r.progress}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-orange-500 mb-1">
                    {selected.year}년 {selected.month}월 {selected.week_number}
                  </p>
                  <h3 className="text-xl font-black text-slate-900">
                    {selected.project_name || '(프로젝트명 없음)'}
                  </h3>
                  {isAdmin && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <User size={11} />
                      작성자: {selected.id}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-600 transition-colors text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {selected.company && <Row label="거래처" value={selected.company} />}
                {selected.work_type && <Row label="업무유형" value={selected.work_type} />}
                {selected.this_week && <Row label="이번 주 업무" value={selected.this_week} multiline />}
                {selected.next_week && <Row label="다음 주 계획" value={selected.next_week} multiline />}
                {selected.issues && <Row label="이슈/위험" value={selected.issues} multiline />}
                {selected.feedback && <Row label="피드백" value={selected.feedback} multiline />}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">진행률</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${selected.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-orange-500 w-8 text-right">
                        {selected.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                {selected.submitted_at && (
                  <Row
                    label="제출일시"
                    value={new Date(selected.submitted_at).toLocaleString('ko-KR')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등록 폼 모달 */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900">주간보고 등록</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-300 hover:text-slate-600 transition-colors text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 년/월/주차 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">년도 *</label>
                    <select name="year" value={form.year} onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      {YEARS.map((y) => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">월 *</label>
                    <select name="month" value={form.month} onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      {MONTHS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">주차 *</label>
                    <select name="week_number" value={form.week_number} onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      {WEEKS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* 프로젝트명 */}
                <FormInput label="프로젝트명" name="project_name" value={form.project_name ?? ''} onChange={handleFormChange} />

                {/* 거래처 / 업무유형 */}
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="거래처" name="company" value={form.company ?? ''} onChange={handleFormChange} />
                  <FormInput label="업무유형" name="work_type" value={form.work_type ?? ''} onChange={handleFormChange} />
                </div>

                {/* 이번 주 업무 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">이번 주 업무</label>
                  <textarea name="this_week" value={form.this_week ?? ''} onChange={handleFormChange} rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* 다음 주 계획 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">다음 주 계획</label>
                  <textarea name="next_week" value={form.next_week ?? ''} onChange={handleFormChange} rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* 이슈 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">이슈/위험</label>
                  <textarea name="issues" value={form.issues ?? ''} onChange={handleFormChange} rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                </div>

                {/* 진행률 / 우선순위 / 상태 */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">진행률 ({form.progress}%)</label>
                    <input type="range" name="progress" min={0} max={100} value={form.progress} onChange={handleFormChange}
                      className="w-full accent-orange-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">우선순위</label>
                    <select name="priority" value={form.priority ?? ''} onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="">-</option>
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">상태</label>
                    <select name="status" value={form.status ?? ''} onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="">-</option>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all">
                    취소
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
      <p className={`text-slate-700 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input type="text" name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
    </div>
  );
}
