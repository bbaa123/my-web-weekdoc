import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  LogOut,
  User,
  Users,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { getCurrentWeekInfo } from '@/core/utils/date';
import { NoticePanel } from '@/domains/notice/components/NoticePanel';
import { NoticeBar, NOTICE_BAR_HEIGHT } from '@/domains/notice/components/NoticeBar';
import { useNoticeStore } from '@/domains/notice/store';
import { useDepartmentStore } from '@/domains/departments/store';
import { fetchAccessibleDepartments } from '@/domains/departments/api';
import type { Department } from '@/domains/departments/types';
import {
  fetchWeeklyReports,
  fetchTeamReports,
  createWeeklyReports,
  updateWeeklyReport,
  deleteWeeklyReport,
  aiSummarize,
} from '../api';
import type { TeamWeeklyReport, WeeklyReport, WeeklyReportCreate } from '../types';
import { getDueDateStatus } from '../types';
import { WeeklyReportComments } from '../components/WeeklyReportComments';

// ─── 상수 ───────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const YEAR_OPTIONS = ['2026', '2027', '2028', '2029', '2030'];
const MONTH_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const WEEK_OPTIONS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
const CATEGORY_OPTIONS = ['일반업무', '기타업무', '프로젝트'];
const COMPANY_OPTIONS = ['세아홀딩스', '세아베스틸지주', '세아M&S', '세아특수강'];
const STATUS_OPTIONS = ['진행', '중단', '완료'];

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  진행: { label: '진행', cls: 'bg-blue-100 text-blue-700' },
  중단: { label: '중단', cls: 'bg-red-100 text-red-600' },
  완료: { label: '완료', cls: 'bg-emerald-100 text-emerald-700' },
  // 기존 영문 데이터 호환
  COMPLETED: { label: '완료', cls: 'bg-emerald-100 text-emerald-700' },
  'IN PROGRESS': { label: '진행', cls: 'bg-blue-100 text-blue-700' },
  PENDING: { label: '진행', cls: 'bg-blue-100 text-blue-700' },
  DELAYED: { label: '중단', cls: 'bg-red-100 text-red-600' },
  // 기존 한글 데이터 호환
  진행중: { label: '진행', cls: 'bg-blue-100 text-blue-700' },
  대기: { label: '진행', cls: 'bg-blue-100 text-blue-700' },
  지연: { label: '중단', cls: 'bg-red-100 text-red-600' },
  보류: { label: '중단', cls: 'bg-red-100 text-red-600' },
  취소: { label: '중단', cls: 'bg-red-100 text-red-600' },
};

const PAGE_SIZE = 10;

// ─── 폼 행 타입 ──────────────────────────────────────────────────────────────

interface FormRow {
  _key: string;
  year: string;
  month: string;
  week_number: string;
  company: string;
  work_type: string;
  project_name: string;
  this_week: string;
  next_week: string;
  status: string;
  priority: string;
  progress: number;
  issues: string;
  due_date: string; // 완료 예정일
}

// 월요일 시작 기준으로 이번 달 몇 주차인지 계산
function getWeekOfMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();

  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0=일, 1=월, ..., 6=토

  // 이 달의 첫 번째 월요일까지의 오프셋 (월요일이면 0)
  const daysToFirstMonday = firstDayOfWeek === 1 ? 0 : (8 - firstDayOfWeek) % 7;
  const firstMondayDate = 1 + daysToFirstMonday;

  // 첫 번째 월요일 이전 날짜는 1주차로 처리
  if (dayOfMonth < firstMondayDate) return '1주차';

  const weekNum = Math.min(Math.floor((dayOfMonth - firstMondayDate) / 7) + 1, 5);
  return `${weekNum}주차`;
}

function makeEmptyRow(): FormRow {
  const now = new Date();
  return {
    _key: Math.random().toString(36).slice(2),
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    week_number: getWeekOfMonth(now),
    company: '',
    work_type: '',
    project_name: '',
    this_week: '',
    next_week: '',
    status: '',
    priority: '',
    progress: 0,
    issues: '',
    due_date: '',
  };
}

// ─── 서브 컴포넌트: ProgressBar ──────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const barColor =
    value <= 30 ? 'bg-red-500' : value <= 70 ? 'bg-yellow-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── 서브 컴포넌트: StatusBadge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">-</span>;
  const mapped = STATUS_DISPLAY[status];
  if (!mapped) return <span className="text-xs text-slate-500">{status}</span>;
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${mapped.cls}`}
    >
      {mapped.label}
    </span>
  );
}


// ─── 서브 컴포넌트: FilterSelect ─────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
        style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── 서브 컴포넌트: NewReportModal (섹션형 그리드 폼) ─────────────────────────

function NewReportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormRow>(makeEmptyRow());
  const [saving, setSaving] = useState(false);
  const [continueAdding, setContinueAdding] = useState(false);

  const update = (field: keyof FormRow, value: string | number) =>
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'status' && value === '완료') {
        updated.progress = 100;
      }
      return updated;
    });

  const handleSave = async (final: boolean) => {
    setSaving(true);
    try {
      const payload: WeeklyReportCreate[] = [
        {
          year: form.year,
          month: form.month,
          week_number: form.week_number,
          company: form.company || null,
          work_type: form.work_type || null,
          project_name: form.work_type === '프로젝트' ? form.project_name || null : null,
          this_week: form.this_week || null,
          next_week: form.next_week || null,
          progress: form.progress,
          priority: null,
          issues: form.issues || null,
          status: form.status || null,
          due_date: form.due_date || null,
        },
      ];
      await createWeeklyReports(payload);
      toast.success(final ? '주간보고가 최종 등록되었습니다.' : '임시 저장되었습니다.');
      onSuccess();
      if (final || !continueAdding) {
        onClose();
      } else {
        setForm(makeEmptyRow());
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all w-full';
  const labelCls = 'text-xs font-semibold text-slate-500 mb-1 block';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 컬러바 */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#fff3e8' }}
            >
              <Plus size={16} style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">New Weekly Report</h2>
              <p className="text-xs text-slate-400 mt-0.5">주간 보고서를 작성해주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 — 섹션형 2-컬럼 그리드 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── 날짜 섹션 ── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: BRAND }}
              />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">날짜 정보</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>연도</label>
                <select
                  value={form.year}
                  onChange={(e) => update('year', e.target.value)}
                  className={fieldCls}
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>월</label>
                <select
                  value={form.month}
                  onChange={(e) => update('month', e.target.value)}
                  className={fieldCls}
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>주차</label>
                <select
                  value={form.week_number}
                  onChange={(e) => update('week_number', e.target.value)}
                  className={fieldCls}
                >
                  {WEEK_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── 메인 2-컬럼 그리드 ── */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {/* 좌측 컬럼 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">프로젝트 정보</span>
              </div>

              {/* 프로젝트명 */}
              <div>
                <label className={labelCls}>프로젝트명</label>
                <input
                  type="text"
                  value={form.project_name}
                  onChange={(e) => update('project_name', e.target.value)}
                  placeholder="프로젝트명 입력 (선택)"
                  className={fieldCls}
                />
              </div>

              {/* 업체명 */}
              <div>
                <label className={labelCls}>업체명</label>
                <select
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className={fieldCls}
                >
                  <option value="">업체 선택</option>
                  {COMPANY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 금주 진행 사항 */}
              <div className="flex-1">
                <label className={labelCls}>금주 진행 사항</label>
                <textarea
                  rows={4}
                  value={form.this_week}
                  onChange={(e) => update('this_week', e.target.value)}
                  placeholder="이번 주에 진행한 업무를 입력하세요"
                  className={`${fieldCls} resize-none`}
                />
              </div>

              {/* 진행률 슬라이더 */}
              <div>
                <label className={labelCls}>
                  진행률
                  <span
                    className="ml-2 font-black text-sm"
                    style={{ color: BRAND }}
                  >
                    {form.progress}%
                  </span>
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400 w-5">0</span>
                  <div className="relative flex-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={form.progress}
                      onChange={(e) => update('progress', Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${BRAND} ${form.progress}%, #e2e8f0 ${form.progress}%)`,
                        accentColor: BRAND,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8">100%</span>
                </div>
                {/* 진행률 단계 표시 */}
                <div className="flex justify-between mt-1 px-8">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <span key={v} className="text-[10px] text-slate-300">{v}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측 컬럼 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: BRAND }}
                />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">업무 상세</span>
              </div>

              {/* 작업 구분 */}
              <div>
                <label className={labelCls}>작업 구분</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'IN PROGRESS', label: '진행중' },
                    { val: 'COMPLETED', label: '완료' },
                    { val: 'PENDING', label: '대기' },
                    { val: 'DELAYED', label: '지연' },
                    { val: '일반업무', label: '일반' },
                    { val: '프로젝트', label: '프로젝트' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('work_type', val)}
                      className={`text-xs font-semibold py-1.5 rounded-lg border transition-all ${
                        form.work_type === val
                          ? 'text-white border-transparent shadow-sm'
                          : 'text-slate-500 border-slate-200 hover:border-orange-200 hover:text-orange-600 bg-white'
                      }`}
                      style={
                        form.work_type === val
                          ? { backgroundColor: BRAND, borderColor: BRAND }
                          : {}
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 차주 계획 */}
              <div className="flex-1">
                <label className={labelCls}>차주 계획</label>
                <textarea
                  rows={4}
                  value={form.next_week}
                  onChange={(e) => update('next_week', e.target.value)}
                  placeholder="다음 주 계획을 입력하세요"
                  className={`${fieldCls} resize-none`}
                />
              </div>

              {/* 특이사항 */}
              <div>
                <label className={labelCls}>특이사항 / 이슈</label>
                <textarea
                  rows={2}
                  value={form.issues}
                  onChange={(e) => update('issues', e.target.value)}
                  placeholder="이슈 및 특이사항 (선택)"
                  className={`${fieldCls} resize-none`}
                />
              </div>

              {/* 완료 예정일 */}
              <div>
                <label className={labelCls}>
                  완료 예정일
                  <span className="ml-1 text-red-400 text-xs">*필수</span>
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => update('due_date', e.target.value)}
                  className={`${fieldCls} ${!form.due_date ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                />
                {!form.due_date && (
                  <p className="mt-1 text-[10px] text-red-400 font-medium">완료 예정일을 입력해주세요</p>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            {/* 저장 후 계속 추가 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={continueAdding}
                  onChange={(e) => setContinueAdding(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    continueAdding ? 'border-transparent' : 'border-slate-300 bg-white group-hover:border-orange-300'
                  }`}
                  style={continueAdding ? { backgroundColor: BRAND, borderColor: BRAND } : {}}
                >
                  {continueAdding && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                저장 후 계속 추가
              </span>
            </label>

            {/* 버튼 그룹 */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-all disabled:opacity-50"
                style={{ color: BRAND, borderColor: BRAND, backgroundColor: '#fff8f3' }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                임시 저장
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-bold text-white px-5 py-2 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                최종 등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: EditReportModal (Read-only 상세 조회, 7:3 레이아웃) ──────

function EditReportModal({
  report,
  onClose,
  onSuccess,
}: {
  report: WeeklyReport;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.login_id === report.id;
  const isAdmin = user?.is_admin ?? false;

  const teamRow = report as TeamWeeklyReport;
  const displayName = teamRow.author_name || report.id;
  const initials = displayName.slice(0, 2).toUpperCase();
  const progress = report.progress ?? 0;
  const progressColor =
    progress <= 30 ? 'bg-red-500' : progress <= 70 ? 'bg-yellow-400' : 'bg-emerald-500';

  const handleDelete = async () => {
    if (!confirm('이 주간보고를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await deleteWeeklyReport(report.weekly_reports_no);
      toast.success('주간보고가 삭제되었습니다.');
      onSuccess();
      onClose();
    } catch {
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 컬러바 */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: BRAND }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {report.project_name || report.work_type || '주간보고서'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {displayName} · {report.year}년 {report.month}월 {report.week_number}
                {report.company && ` · ${report.company}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => { onClose(); navigate('/weekly-sync/bulk-edit'); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                style={{ color: BRAND, borderColor: BRAND, backgroundColor: '#fff8f3' }}
              >
                수정하기
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                삭제
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors rounded-lg p-1.5 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 본문: 7:3 분할 */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── 좌측 70%: 내용 ── */}
          <div className="flex-[7] overflow-y-auto px-7 py-6 space-y-5">

            {/* 상태 + 진행률 + 업무유형 배지 */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={report.status} />
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-black" style={{ color: BRAND }}>
                  {progress}%
                </span>
              </div>
              {report.work_type && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {report.work_type}
                </span>
              )}
              {teamRow.department && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                  {teamRow.department}
                </span>
              )}
              {/* 완료 예정일 */}
              {(() => {
                const ds = getDueDateStatus(report.due_date, report.status);
                if (!report.due_date) return null;
                if (ds === 'overdue') return (
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 border border-red-200">
                    <AlertTriangle size={11} />
                    완료 예정일 {report.due_date} (지연)
                  </span>
                );
                if (ds === 'today') return (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                    완료 예정일 {report.due_date} (오늘 마감)
                  </span>
                );
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    완료 예정일 {report.due_date}
                  </span>
                );
              })()}
            </div>

            {/* 이번주 업무 카드 */}
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: BRAND }} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  이번주 업무
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-7 whitespace-pre-wrap">
                {report.this_week || (
                  <span className="text-slate-300 italic">내용이 없습니다.</span>
                )}
              </p>
            </div>

            {/* 차주 계획 카드 */}
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 rounded-full bg-blue-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  차주 계획
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-7 whitespace-pre-wrap">
                {report.next_week || (
                  <span className="text-slate-300 italic">내용이 없습니다.</span>
                )}
              </p>
            </div>

            {/* 이슈/특이사항 카드 (내용이 있을 때만) */}
            {report.issues && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-4 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                    이슈 / 특이사항
                  </span>
                </div>
                <p className="text-sm text-amber-900 leading-7 whitespace-pre-wrap">
                  {report.issues}
                </p>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="w-px bg-slate-100 shrink-0" />

          {/* ── 우측 30%: 댓글 패널 ── */}
          <div className="flex-[3] bg-gray-50 flex flex-col overflow-hidden min-w-0">
            <WeeklyReportComments reportNo={report.weekly_reports_no} panelMode />
          </div>

        </div>
      </div>
    </div>
  );
}


// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function WeeklySyncPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { notices: barNotices, isDismissed: isBarDismissed } = useNoticeStore();
  const isBarVisible = !isBarDismissed && barNotices.length > 0;
  const { departments: activeDepartments, fetchActive: fetchActiveDepts } = useDepartmentStore();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [teamReports, setTeamReports] = useState<TeamWeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [summarizingNos, setSummarizingNos] = useState<Set<number>>(new Set());
  const [editTarget, setEditTarget] = useState<WeeklyReport | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [teamFilterDepartment, setTeamFilterDepartment] = useState('');
  const [accessibleDepartments, setAccessibleDepartments] = useState<Department[]>([]);

  // 필터 상태 (현재 연도·월·주차를 기본값으로 설정)
  const { year: currentYear, month: currentMonth, weekNumber: currentWeekNumber } =
    getCurrentWeekInfo();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterWeek, setFilterWeek] = useState(currentWeekNumber);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadReports();
    loadTeamReports();
    fetchActiveDepts();
    loadAccessibleDepts(user.is_admin);
  }, [user]);

  const loadAccessibleDepts = async (isAdminUser: boolean) => {
    try {
      const depts = await fetchAccessibleDepartments();
      setAccessibleDepartments(depts);
      // 기본값: admin이 아닌 경우 본인 소속 부서(첫 번째 항목)를 기본 선택
      if (!isAdminUser && depts.length > 0) {
        setTeamFilterDepartment(depts[0].dept_code);
      }
    } catch {
      // 접근 가능 부서 로드 실패 시 무시
    }
  };

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

  const loadTeamReports = async () => {
    setTeamLoading(true);
    try {
      const data = await fetchTeamReports();
      setTeamReports(data);
    } catch {
      toast.error('팀 주간보고를 불러오는 데 실패했습니다.');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const resetFilters = () => {
    setFilterYear('');
    setFilterMonth('');
    setFilterWeek('');
    setFilterCategory('');
    setFilterCompany('');
    setTeamFilterDepartment('');
    setPage(1);
  };

  const handleAiSummarize = async (no: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSummarizingNos((prev) => new Set(prev).add(no));
    try {
      const result = await aiSummarize(no);
      setTeamReports((prev) =>
        prev.map((r) =>
          r.weekly_reports_no === no ? { ...r, summary: result.summary } : r
        )
      );
      toast.success('AI 요약이 완료되었습니다.');
    } catch {
      toast.error('AI 요약에 실패했습니다.');
    } finally {
      setSummarizingNos((prev) => {
        const next = new Set(prev);
        next.delete(no);
        return next;
      });
    }
  };

  // 내 보고서 필터 (admin은 자신의 ID로 client-side 필터)
  const myReports = useMemo(() => {
    if (!user?.is_admin) return reports;
    const loginId = user.login_id ?? '';
    return reports.filter((r) => r.id === loginId);
  }, [reports, user]);

  // 내 보고서 필터 적용
  const myFiltered = useMemo(() => {
    return myReports.filter((r) => {
      if (filterYear && r.year !== filterYear) return false;
      if (filterMonth && r.month !== filterMonth) return false;
      if (filterWeek && r.week_number !== filterWeek) return false;
      if (filterCategory && r.work_type !== filterCategory) return false;
      if (filterCompany && r.company !== filterCompany) return false;
      return true;
    });
  }, [myReports, filterYear, filterMonth, filterWeek, filterCategory, filterCompany]);

  // 부서 코드로 부서명 조회 헬퍼
  const getDeptName = (deptCode: string | null | undefined): string => {
    if (!deptCode) return '-';
    const found = activeDepartments.find((d) => d.dept_code === deptCode);
    return found ? found.dept_name : deptCode;
  };

  // 팀 보고서 필터 적용
  const teamFiltered = useMemo(() => {
    return teamReports.filter((r) => {
      if (teamFilterDepartment && r.department !== teamFilterDepartment) return false;
      if (filterYear && r.year !== filterYear) return false;
      if (filterMonth && r.month !== filterMonth) return false;
      if (filterWeek && r.week_number !== filterWeek) return false;
      if (filterCategory && r.work_type !== filterCategory) return false;
      if (filterCompany && r.company !== filterCompany) return false;
      return true;
    });
  }, [teamReports, teamFilterDepartment, filterYear, filterMonth, filterWeek, filterCategory, filterCompany]);

  // 현재 탭 기준 filtered 데이터
  const filtered = activeTab === 'my' ? myFiltered : teamFiltered;
  const isTabLoading = activeTab === 'my' ? loading : teamLoading;

  // 필터/탭 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [activeTab, filterYear, filterMonth, filterWeek, filterCategory, filterCompany, teamFilterDepartment]);

  // 요약 통계 (필터 적용된 데이터 기준)
  const summary = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter(
      (r) => r.status === '완료' || r.status === 'COMPLETED'
    ).length;
    const delayed = filtered.filter(
      (r) => r.status === '중단' || r.status === 'DELAYED' || r.status === '지연'
    ).length;
    const withIssues = filtered.filter((r) => r.issues && r.issues.trim() !== '').length;
    const avgProgress =
      total > 0 ? Math.round(filtered.reduce((sum, r) => sum + (r.progress ?? 0), 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueCount = filtered.filter((r) => getDueDateStatus(r.due_date, r.status) === 'overdue').length;
    const dueTodayCount = filtered.filter((r) => getDueDateStatus(r.due_date, r.status) === 'today').length;
    return { total, completed, delayed, withIssues, avgProgress, completionRate, overdueCount, dueTodayCount };
  }, [filtered]);

  // 이슈 요약 텍스트
  const issueHighlights = useMemo(() => {
    return filtered
      .filter((r) => r.issues && r.issues.trim() !== '')
      .slice(0, 3)
      .map((r) => r.issues as string);
  }, [filtered]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!user) return null;
  const isAdmin = user.is_admin;

  // 현재 필터 주간 표시 텍스트
  const periodLabel = [filterYear, filterMonth && `${filterMonth}월`, filterWeek]
    .filter(Boolean)
    .join(' ');

  // ─── PDF 내보내기 ─────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (isPdfGenerating || filtered.length === 0) return;
    setIsPdfGenerating(true);
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const esc = (s: string | null | undefined) =>
        (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const title = `주간 업무 보고서${periodLabel ? ` (${periodLabel})` : ''}`;
      const tabLabel =
        activeTab === 'my' ? '내 보고서 (My Reports)' : '팀 보고서 (Team Reports)';
      const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const rowsHtml = filtered
        .map((r, i) => {
          const teamRow = activeTab === 'team' ? (r as TeamWeeklyReport) : null;
          const displayName = teamRow ? teamRow.author_name || r.id : r.id;
          const initials = displayName.slice(0, 2).toUpperCase();
          const progress = r.progress ?? 0;
          const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';

          let statusBg = '#f1f5f9',
            statusColor = '#64748b',
            statusLabel = r.status ?? '-';
          if (r.status === '완료' || r.status === 'COMPLETED') {
            statusBg = '#d1fae5'; statusColor = '#065f46'; statusLabel = '완료';
          } else if (r.status === '진행' || r.status === 'IN PROGRESS' || r.status === 'PENDING' || r.status === '진행중' || r.status === '대기') {
            statusBg = '#dbeafe'; statusColor = '#1d4ed8'; statusLabel = '진행';
          } else if (r.status === '중단' || r.status === 'DELAYED' || r.status === '지연' || r.status === '보류' || r.status === '취소') {
            statusBg = '#fee2e2'; statusColor = '#dc2626'; statusLabel = '중단';
          }

          const barColor =
            progress <= 30 ? '#ef4444' : progress <= 70 ? '#facc15' : '#10b981';

          const memberTd = `
            <td style="padding:10px 12px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#FF6B00;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${initials}</div>
                <div>
                  <div style="font-weight:600;color:#1e293b;font-size:12px;">${esc(displayName)}</div>
                  ${r.company ? `<div style="font-size:10px;color:#94a3b8;">${esc(r.company)}</div>` : ''}
                </div>
              </div>
            </td>`;

          const deptTd = teamRow
            ? `<td style="padding:10px 12px;vertical-align:middle;"><span style="font-size:11px;font-weight:600;padding:2px 8px;background:#f1f5f9;color:#475569;border-radius:9999px;">${esc(teamRow.department)}</span></td>`
            : '';

          return `
            <tr style="background:${rowBg};border-bottom:1px solid #f1f5f9;">
              ${memberTd}
              ${deptTd}
              <td style="padding:10px 12px;vertical-align:middle;color:#475569;font-size:12px;">${esc(r.work_type) || '-'}</td>
              <td style="padding:10px 12px;vertical-align:middle;color:#475569;font-size:12px;max-width:200px;word-break:break-word;">${esc(r.this_week) || '-'}</td>
              <td style="padding:10px 12px;vertical-align:middle;color:#475569;font-size:12px;max-width:200px;word-break:break-word;">${esc(r.next_week) || '-'}</td>
              <td style="padding:10px 12px;vertical-align:middle;white-space:nowrap;">
                ${r.status ? `<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:9999px;background:${statusBg};color:${statusColor};">${statusLabel}</span>` : '<span style="font-size:11px;color:#94a3b8;">-</span>'}
              </td>
              <td style="padding:10px 12px;vertical-align:middle;min-width:90px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <div style="flex:1;height:5px;background:#f1f5f9;border-radius:9999px;overflow:hidden;min-width:60px;">
                    <div style="height:100%;width:${progress}%;background:${barColor};border-radius:9999px;"></div>
                  </div>
                  <span style="font-size:11px;font-weight:600;color:#475569;min-width:28px;text-align:right;">${progress}%</span>
                </div>
              </td>
            </tr>`;
        })
        .join('');

      const authorHeader =
        activeTab === 'team'
          ? `<th style="padding:10px 12px;text-align:left;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Author</th>
             <th style="padding:10px 12px;text-align:left;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Department</th>`
          : `<th style="padding:10px 12px;text-align:left;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">Member</th>`;

      const thStyle =
        'padding:10px 12px;text-align:left;font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;';

      const container = document.createElement('div');
      container.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1100px;background:#fff;padding:40px 40px 48px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box;';

      container.innerHTML = `
        <div style="margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #FF6B00;">
          <h1 style="font-size:20px;font-weight:900;color:#FF6B00;margin:0 0 6px 0;letter-spacing:-.01em;">${esc(title)}</h1>
          <p style="font-size:12px;color:#64748b;margin:0;">${esc(tabLabel)} &nbsp;|&nbsp; 생성일: ${today} &nbsp;|&nbsp; 총 ${filtered.length}건</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
              ${authorHeader}
              <th style="${thStyle}white-space:nowrap;">Category</th>
              <th style="${thStyle}">This Week's Achievements</th>
              <th style="${thStyle}">Next Week's Plan</th>
              <th style="${thStyle}white-space:nowrap;">상태</th>
              <th style="${thStyle}white-space:nowrap;">진도율</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(container);

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printW = pageW - margin * 2;
      const totalImgH = (canvas.height * printW) / canvas.width;
      const availH = pageH - margin * 2;

      if (totalImgH <= availH) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, printW, totalImgH);
      } else {
        const pxPerMm = canvas.width / printW;
        const slicePxMax = Math.floor(availH * pxPerMm);
        let srcY = 0;
        let isFirst = true;
        while (srcY < canvas.height) {
          if (!isFirst) pdf.addPage();
          const slicePx = Math.min(slicePxMax, canvas.height - srcY);
          const sliceMm = slicePx / pxPerMm;
          const sc = document.createElement('canvas');
          sc.width = canvas.width;
          sc.height = slicePx;
          sc.getContext('2d')?.drawImage(
            canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx
          );
          pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, margin, printW, sliceMm);
          srcY += slicePx;
          isFirst = false;
        }
      }

      const fileDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const authorName = user.name || user.login_id || 'Unknown';
      pdf.save(`Weekly_Report_${fileDateStr}_${authorName}.pdf`);
      toast.success('PDF가 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-orange-50"
      style={{ paddingTop: isBarVisible ? NOTICE_BAR_HEIGHT : 0 }}
    >
      {/* ── 상단 공지 알림 바 ─────────────────────────────── */}
      <NoticeBar />

      {/* ── 헤더 ─────────────────────────────────────────── */}
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
            <span className="text-slate-900 border-b-2 pb-0.5" style={{ borderColor: BRAND }}>
              Dashboard
            </span>
            <button
              onClick={() => navigate('/reports')}
              className="hover:text-slate-700 cursor-pointer"
            >
              Reports
            </button>
            <button
              onClick={() => navigate('/org-chart')}
              className="hover:text-slate-700 cursor-pointer"
            >
              Teams
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-page')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 hover:border-orange-200 transition-all cursor-pointer"
              title="My Page로 이동"
            >
              {/* 아바타: 사진 > 닉네임 > 이름 순서 */}
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
              {user.login_id && (
                <span className="text-xs text-slate-400 font-mono">{user.login_id}</span>
              )}
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
        {/* ── 페이지 타이틀 + 버튼 ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Weekly Reporting Dashboard</h1>
            {periodLabel && (
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                <CalendarDays size={13} />
                {periodLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPdf}
              disabled={isPdfGenerating || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  PDF 생성 중...
                </>
              ) : (
                <>
                  <FileText size={15} />
                  Export PDF
                </>
              )}
            </button>
            <button
              onClick={() =>
                navigate('/weekly-sync/bulk-edit', {
                  state: {
                    year: filterYear || currentYear,
                    month: filterMonth || currentMonth,
                    weekNumber: filterWeek || currentWeekNumber,
                  },
                })
              }
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={15} />
              New Update
            </button>
          </div>
        </div>

        {/* ── 지연/오늘 마감 알림 배너 ────────────────────────── */}
        {(summary.overdueCount > 0 || summary.dueTodayCount > 0) && (
          <div className="flex flex-wrap gap-3">
            {summary.overdueCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-semibold">
                <AlertTriangle size={15} className="shrink-0" />
                완료 예정일 초과 업무 <strong>{summary.overdueCount}건</strong> — 즉시 확인이 필요합니다
              </div>
            )}
            {summary.dueTodayCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 font-semibold">
                오늘 완료 예정 업무 <strong>{summary.dueTodayCount}건</strong>
              </div>
            )}
          </div>
        )}

        {/* ── 필터 영역 ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <FilterSelect
              label="년도"
              value={filterYear}
              onChange={setFilterYear}
              options={YEAR_OPTIONS}
              placeholder="전체 년도"
            />
            <FilterSelect
              label="월"
              value={filterMonth}
              onChange={setFilterMonth}
              options={MONTH_OPTIONS}
              placeholder="전체 월"
            />
            <FilterSelect
              label="주"
              value={filterWeek}
              onChange={setFilterWeek}
              options={WEEK_OPTIONS}
              placeholder="전체 주차"
            />
            <FilterSelect
              label="업무유형"
              value={filterCategory}
              onChange={setFilterCategory}
              options={CATEGORY_OPTIONS}
              placeholder="전체 유형"
            />
            <FilterSelect
              label="담당회사"
              value={filterCompany}
              onChange={setFilterCompany}
              options={COMPANY_OPTIONS}
              placeholder="전체 회사"
            />
            <div className="flex flex-col gap-1 justify-end">
              <label className="text-xs font-semibold text-transparent select-none">초기화</label>
              <button
                onClick={resetFilters}
                className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* ── 탭 바 ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center border-b border-slate-100">
            <button
              onClick={() => setActiveTab('my')}
              className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-colors ${
                activeTab === 'my' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User size={15} />
              내 보고서 (My Reports)
              {activeTab === 'my' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: BRAND }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-bold transition-colors ${
                activeTab === 'team' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users size={15} />
              팀 보고서 (Team Reports)
              {activeTab === 'team' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: BRAND }}
                />
              )}
            </button>
            {/* 모든 사용자: 팀 보고서 탭에서 부서 선택 (계층 권한 적용) */}
            {activeTab === 'team' && (
              <div className="ml-auto px-4 flex items-center gap-2">
                <button
                  onClick={() => navigate('/weekly-sync/team-view')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all"
                  style={{
                    backgroundColor: '#FFF7F0',
                    border: `1.5px solid ${BRAND}`,
                    color: BRAND,
                  }}
                >
                  <Users size={13} />
                  피드 뷰로 보기
                </button>
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: BRAND }}>
                  부서 선택
                </span>
                <select
                  value={teamFilterDepartment}
                  onChange={(e) => setTeamFilterDepartment(e.target.value)}
                  className="text-sm rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer"
                  style={{
                    backgroundColor: '#FFF7F0',
                    border: `1.5px solid ${BRAND}`,
                    color: BRAND,
                    '--tw-ring-color': BRAND,
                  } as React.CSSProperties}
                >
                  {isAdmin && <option value="">전체 부서</option>}
                  {accessibleDepartments.map((dept) => (
                    <option key={dept.dept_code} value={dept.dept_code}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── 테이블 ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {isTabLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <Loader2 className="animate-spin" size={32} style={{ color: BRAND }} />
              <p className="text-sm text-slate-400">불러오는 중...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <FileText size={40} className="text-slate-300" />
              <p className="text-slate-400 font-medium">조건에 맞는 주간보고가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {activeTab === 'team' ? '사원' : '사원'}
                      </th>
                      {activeTab === 'team' && (
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          부서
                        </th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        업무유형
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        이번주 업무
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        다음주 계획
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        상태
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-red-600 uppercase tracking-wide whitespace-nowrap bg-red-50/30">
                        완료 예정일
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        진도율
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((r) => {
                      const teamRow = activeTab === 'team' ? (r as TeamWeeklyReport) : null;
                      const displayName = teamRow ? teamRow.author_name || r.id : r.id;
                      const initials = displayName.slice(0, 2).toUpperCase();
                      return (
                      <tr
                        key={r.weekly_reports_no}
                        onClick={() => setEditTarget(r)}
                        className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                      >
                        {/* Author / Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: BRAND }}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{displayName}</p>
                              {r.company && (
                                <p className="text-xs text-slate-400">{r.company}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Department (팀 보고서 탭 전용) */}
                        {activeTab === 'team' && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                              {getDeptName(teamRow?.department)}
                            </span>
                          </td>
                        )}

                        {/* Category */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">{r.work_type ?? '-'}</span>
                        </td>

                        {/* This Week */}
                        <td className="px-4 py-4 max-w-[240px]">
                          <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                            {r.this_week ?? '-'}
                          </p>
                        </td>

                        {/* Next Week */}
                        <td className="px-4 py-4 max-w-[240px]">
                          <p className="text-sm text-slate-600 line-clamp-2 leading-snug">
                            {r.next_week ?? '-'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {(() => {
                            const ds = getDueDateStatus(r.due_date, r.status);
                            if (!r.due_date) return <span className="text-xs text-slate-300">-</span>;
                            if (ds === 'overdue') return (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                <AlertTriangle size={11} />
                                {r.due_date}
                              </span>
                            );
                            if (ds === 'today') return (
                              <span className="text-xs font-bold text-orange-500">{r.due_date}</span>
                            );
                            return <span className="text-xs text-slate-500">{r.due_date}</span>;
                          })()}
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-4">
                          <ProgressBar value={r.progress ?? 0} />
                        </td>

                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400">
                  총 <span className="font-semibold text-slate-600">{filtered.length}</span>건 중{' '}
                  <span className="font-semibold text-slate-600">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)}
                  </span>
                  건 표시
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (
                        idx > 0 &&
                        typeof arr[idx - 1] === 'number' &&
                        (p as number) - (arr[idx - 1] as number) > 1
                      ) {
                        acc.push('...');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="text-xs text-slate-400 px-1">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-7 h-7 text-xs font-semibold rounded-lg transition-all ${
                            page === p
                              ? 'text-white shadow-sm'
                              : 'text-slate-600 border border-slate-200 hover:bg-white'
                          }`}
                          style={page === p ? { backgroundColor: BRAND } : {}}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── 신규 등록 모달 ─────────────────────────────────── */}
      {showNewModal && (
        <NewReportModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => { loadReports(); loadTeamReports(); }}
        />
      )}

      {/* ── 수정/삭제 모달 ─────────────────────────────────── */}
      {editTarget && (
        <EditReportModal
          report={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { loadReports(); loadTeamReports(); }}
        />
      )}

      {/* ── 공지사항 슬라이드 패널 ─────────────────────────── */}
      <NoticePanel />
    </div>
  );
}
