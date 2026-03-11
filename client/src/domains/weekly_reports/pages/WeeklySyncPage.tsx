import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Shield,
  User,
  Users,
  Loader2,
  FileText,
  AlertTriangle,
  TrendingUp,
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
} from '../api';
import type { TeamWeeklyReport, WeeklyReport, WeeklyReportCreate } from '../types';
import { WeeklyReportComments } from '../components/WeeklyReportComments';

// ─── 상수 ───────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const YEAR_OPTIONS = ['2026', '2027', '2028', '2029', '2030'];
const MONTH_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const WEEK_OPTIONS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
const CATEGORY_OPTIONS = ['일반업무', '기타업무', '프로젝트'];
const COMPANY_OPTIONS = ['세아홀딩스', '세아베스틸지주', '세아M&S', '세아특수강'];
const STATUS_OPTIONS = ['COMPLETED', 'IN PROGRESS', 'PENDING', 'DELAYED'];
const PRIORITY_OPTIONS = ['HIGH', 'MED', 'LOW'];

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: 'COMPLETED', cls: 'bg-slate-800 text-white' },
  'IN PROGRESS': { label: 'IN PROGRESS', cls: 'bg-blue-100 text-blue-700' },
  PENDING: { label: 'PENDING', cls: 'bg-amber-100 text-amber-700' },
  DELAYED: { label: 'DELAYED', cls: 'bg-red-100 text-red-600' },
  // 기존 한글 데이터 호환
  완료: { label: 'COMPLETED', cls: 'bg-slate-800 text-white' },
  진행중: { label: 'IN PROGRESS', cls: 'bg-blue-100 text-blue-700' },
  대기: { label: 'PENDING', cls: 'bg-amber-100 text-amber-700' },
  지연: { label: 'DELAYED', cls: 'bg-red-100 text-red-600' },
  보류: { label: 'ON HOLD', cls: 'bg-purple-100 text-purple-700' },
  취소: { label: 'CANCELED', cls: 'bg-slate-100 text-slate-500' },
};

const PRIORITY_DISPLAY: Record<string, { label: string; dot: string; cls: string }> = {
  HIGH: { label: 'HIGH', dot: 'bg-red-500', cls: 'text-red-600' },
  MED: { label: 'MED', dot: 'bg-amber-400', cls: 'text-amber-600' },
  LOW: { label: 'LOW', dot: 'bg-slate-400', cls: 'text-slate-500' },
  // 기존 한글 데이터 호환
  높음: { label: 'HIGH', dot: 'bg-red-500', cls: 'text-red-600' },
  중간: { label: 'MED', dot: 'bg-amber-400', cls: 'text-amber-600' },
  낮음: { label: 'LOW', dot: 'bg-slate-400', cls: 'text-slate-500' },
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

// ─── 서브 컴포넌트: PriorityBadge ───────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-xs text-slate-400">-</span>;
  const mapped = PRIORITY_DISPLAY[priority];
  if (!mapped) return <span className="text-xs text-slate-500">{priority}</span>;
  return (
    <div className={`flex items-center gap-1.5 ${mapped.cls}`}>
      <span className={`w-2 h-2 rounded-full inline-block ${mapped.dot}`} />
      <span className="text-xs font-bold">{mapped.label}</span>
    </div>
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

// ─── 서브 컴포넌트: FormRowCard ──────────────────────────────────────────────

function FormRowCard({
  row,
  index,
  total,
  onChange,
  onRemove,
}: {
  row: FormRow;
  index: number;
  total: number;
  onChange: (key: string, field: keyof FormRow, value: string | number) => void;
  onRemove: (key: string) => void;
}) {
  const update = (field: keyof FormRow, value: string | number) =>
    onChange(row._key, field, value);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 relative">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: BRAND }}
        >
          #{index + 1}
        </span>
        {total > 1 && (
          <button
            onClick={() => onRemove(row._key)}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Year */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">년도</label>
          <select
            value={row.year}
            onChange={(e) => update('year', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
            style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">월</label>
          <select
            value={row.month}
            onChange={(e) => update('month', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Week */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">주</label>
          <select
            value={row.week_number}
            onChange={(e) => update('week_number', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            {WEEK_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">업무유형</label>
          <select
            value={row.work_type}
            onChange={(e) => update('work_type', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            <option value="">선택</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Project Name (프로젝트 선택 시) */}
        {row.work_type === '프로젝트' && (
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold text-slate-500">Project Name</label>
            <input
              type="text"
              value={row.project_name}
              onChange={(e) => update('project_name', e.target.value)}
              placeholder="프로젝트명 입력"
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
            />
          </div>
        )}

        {/* Company */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">담당회사</label>
          <select
            value={row.company}
            onChange={(e) => update('company', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            <option value="">선택</option>
            {COMPANY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">상태</label>
          <select
            value={row.status}
            onChange={(e) => update('status', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            <option value="">선택</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">중요도</label>
          <select
            value={row.priority}
            onChange={(e) => update('priority', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1"
          >
            <option value="">선택</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500">진도율 (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={row.progress}
            onChange={(e) => {
              const v = Math.min(100, Math.max(0, Number(e.target.value)));
              update('progress', v);
            }}
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 w-full"
          />
        </div>

        {/* This Week */}
        <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
          <label className="text-xs font-semibold text-slate-500">
            이번주 업무
          </label>
          <textarea
            rows={2}
            value={row.this_week}
            onChange={(e) => update('this_week', e.target.value)}
            placeholder="이번 주 업무 내용"
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 resize-none"
          />
        </div>

        {/* Next Week */}
        <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
          <label className="text-xs font-semibold text-slate-500">다음주 계획</label>
          <textarea
            rows={2}
            value={row.next_week}
            onChange={(e) => update('next_week', e.target.value)}
            placeholder="다음 주 계획"
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 resize-none"
          />
        </div>

        {/* Issues */}
        <div className="flex flex-col gap-1 col-span-2 md:col-span-3">
          <label className="text-xs font-semibold text-slate-500">이슈사항</label>
          <textarea
            rows={2}
            value={row.issues}
            onChange={(e) => update('issues', e.target.value)}
            placeholder="이슈 및 위험 요소 (선택)"
            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: NewReportModal ───────────────────────────────────────────

function NewReportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rows, setRows] = useState<FormRow[]>([makeEmptyRow()]);
  const [saving, setSaving] = useState(false);

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow()]);

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r._key !== key));

  const updateRow = (key: string, field: keyof FormRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: WeeklyReportCreate[] = rows.map((r) => ({
        year: r.year,
        month: r.month,
        week_number: r.week_number,
        company: r.company || null,
        work_type: r.work_type || null,
        project_name: r.work_type === '프로젝트' ? r.project_name || null : null,
        this_week: r.this_week || null,
        next_week: r.next_week || null,
        progress: r.progress,
        priority: r.priority || null,
        issues: r.issues || null,
        status: r.status || null,
      }));
      await createWeeklyReports(payload);
      toast.success(`${rows.length}건의 주간보고가 등록되었습니다.`);
      onSuccess();
      onClose();
    } catch {
      toast.error('등록 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-black text-slate-900">New Weekly Report</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {rows.map((row, i) => (
            <FormRowCard
              key={row._key}
              row={row}
              index={i}
              total={rows.length}
              onChange={updateRow}
              onRemove={removeRow}
            />
          ))}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
          >
            <Plus size={14} />
            행 추가
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-1.5 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: EditReportModal ─────────────────────────────────────────

function EditReportModal({
  report,
  onClose,
  onSuccess,
}: {
  report: WeeklyReport;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormRow>({
    _key: 'edit',
    year: report.year,
    month: report.month,
    week_number: report.week_number,
    company: report.company ?? '',
    work_type: report.work_type ?? '',
    project_name: report.project_name ?? '',
    this_week: report.this_week ?? '',
    next_week: report.next_week ?? '',
    status: report.status ?? '',
    priority: report.priority ?? '',
    progress: report.progress ?? 0,
    issues: report.issues ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateField = (_key: string, field: keyof FormRow, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWeeklyReport(report.weekly_reports_no, {
        year: form.year,
        month: form.month,
        week_number: form.week_number,
        company: form.company || null,
        work_type: form.work_type || null,
        project_name: form.work_type === '프로젝트' ? form.project_name || null : null,
        this_week: form.this_week || null,
        next_week: form.next_week || null,
        progress: form.progress,
        priority: form.priority || null,
        issues: form.issues || null,
        status: form.status || null,
      });
      toast.success('주간보고가 수정되었습니다.');
      onSuccess();
      onClose();
    } catch {
      toast.error('수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Edit Weekly Report</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <User size={11} />
              {report.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FormRowCard
            row={form}
            index={0}
            total={1}
            onChange={updateField}
            onRemove={() => {}}
          />
          <WeeklyReportComments reportNo={report.weekly_reports_no} />
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-1.5 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              저장
            </button>
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
      (r) => r.status === 'COMPLETED' || r.status === '완료'
    ).length;
    const delayed = filtered.filter(
      (r) => r.status === 'DELAYED' || r.status === '지연'
    ).length;
    const withIssues = filtered.filter((r) => r.issues && r.issues.trim() !== '').length;
    const avgProgress =
      total > 0 ? Math.round(filtered.reduce((sum, r) => sum + (r.progress ?? 0), 0) / total) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, delayed, withIssues, avgProgress, completionRate };
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
          if (r.status === 'COMPLETED' || r.status === '완료') {
            statusBg = '#1e293b'; statusColor = '#ffffff'; statusLabel = 'COMPLETED';
          } else if (r.status === 'IN PROGRESS' || r.status === '진행중') {
            statusBg = '#dbeafe'; statusColor = '#1d4ed8'; statusLabel = 'IN PROGRESS';
          } else if (r.status === 'PENDING' || r.status === '대기') {
            statusBg = '#fef3c7'; statusColor = '#d97706'; statusLabel = 'PENDING';
          } else if (r.status === 'DELAYED' || r.status === '지연') {
            statusBg = '#fee2e2'; statusColor = '#dc2626'; statusLabel = 'DELAYED';
          }

          let priorityColor = '#64748b',
            priorityDot = '#94a3b8',
            priorityLabel = r.priority ?? '-';
          if (r.priority === 'HIGH' || r.priority === '높음') {
            priorityColor = '#dc2626'; priorityDot = '#ef4444'; priorityLabel = 'HIGH';
          } else if (r.priority === 'MED' || r.priority === '중간') {
            priorityColor = '#d97706'; priorityDot = '#fbbf24'; priorityLabel = 'MED';
          } else if (r.priority === 'LOW' || r.priority === '낮음') {
            priorityLabel = 'LOW';
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
              <td style="padding:10px 12px;vertical-align:middle;white-space:nowrap;">
                ${r.priority ? `<div style="display:flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:${priorityDot};display:inline-block;"></span><span style="font-size:11px;font-weight:700;color:${priorityColor};">${priorityLabel}</span></div>` : '<span style="font-size:11px;color:#94a3b8;">-</span>'}
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
              <th style="${thStyle}white-space:nowrap;">Status</th>
              <th style="${thStyle}white-space:nowrap;">Priority</th>
              <th style="${thStyle}white-space:nowrap;">Progress</th>
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
            <span className="hover:text-slate-700 cursor-pointer">Reports</span>
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
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={15} />
              New Update
            </button>
          </div>
        </div>

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

        {/* ── Executive Summary ─────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h2 className="text-base font-black text-slate-800">
                  Executive Summary &amp; Issue Highlights
                </h2>
              </div>
              {isTabLoading ? (
                <p className="text-sm text-slate-400">로딩 중...</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-400">조회 결과가 없습니다.</p>
              ) : (
                <div className="text-sm text-slate-600 leading-relaxed space-y-1">
                  <p>
                    총{' '}
                    <span className="font-bold text-slate-900">{summary.total}건</span>의 보고서 중
                    평균 진행률은{' '}
                    <span className="font-bold" style={{ color: BRAND }}>
                      {summary.avgProgress}%
                    </span>
                    입니다.
                  </p>
                  {summary.delayed > 0 && (
                    <p>
                      <span className="font-bold text-red-600">{summary.delayed}건</span>의 항목이{' '}
                      <span className="font-bold text-red-600">지연(DELAYED)</span> 상태로,
                      즉각적인 조치가 필요합니다.
                    </p>
                  )}
                  {summary.withIssues > 0 && (
                    <p>
                      <span className="font-bold text-amber-600">{summary.withIssues}건</span>의
                      이슈가 등록되어 있습니다.
                    </p>
                  )}
                  {issueHighlights.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {issueHighlights.map((iss, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-500">
                          <AlertTriangle
                            size={13}
                            className="text-amber-400 shrink-0 mt-0.5"
                          />
                          <span className="line-clamp-2">{iss}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* 완료율 원형 표시 */}
            {!isTabLoading && filtered.length > 0 && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      fill="none"
                      stroke={BRAND}
                      strokeWidth="8"
                      strokeDasharray={`${(summary.completionRate / 100) * 188.4} 188.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800">
                      {summary.completionRate}%
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-500">Completion Rate</p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <TrendingUp size={12} />
                  <span>
                    {summary.completed}/{summary.total}
                  </span>
                </div>
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
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        중요도
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

                        {/* Priority */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <PriorityBadge priority={r.priority} />
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
