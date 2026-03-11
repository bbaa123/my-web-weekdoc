/**
 * NewUpdatePopup
 *
 * 주간보고 신규 등록 팝업 — 2단 그리드 레이아웃
 *
 * 레이아웃 구조:
 *   [날짜 섹션 — 3컬럼]
 *   ─────────────────────────────────────────
 *   [좌측 컬럼]              [우측 컬럼]
 *   프로젝트명               업무 구분 (칩)
 *   업체명                   차주 계획 (Textarea)
 *   금주 진행 (Textarea)     특이사항 / 이슈 (Textarea)
 *   진행률 슬라이더          우선순위 (칩)
 *   ─────────────────────────────────────────
 *   [푸터 — 취소 / 임시저장 / 최종등록]
 */

import { useState } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { toast } from '@/core/utils/toast';
import { cn } from '@/core/utils/cn';
import { createWeeklyReports } from '../api';
import type { WeeklyReportCreate } from '../types';

// ─── 상수 ────────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const YEAR_OPTIONS = ['2026', '2027', '2028', '2029', '2030'];
const MONTH_OPTIONS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const WEEK_OPTIONS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
const COMPANY_OPTIONS = ['세아홀딩스', '세아베스틸지주', '세아M&S', '세아특수강'];

const WORK_TYPE_CHIPS = [
  { val: '일반업무', label: '일반업무' },
  { val: '프로젝트', label: '프로젝트' },
  { val: '기타업무', label: '기타업무' },
];

const PRIORITY_CHIPS = [
  {
    val: 'LOW',
    label: '낮음',
    idle: 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400',
    active: 'bg-slate-500 text-white border-slate-500',
  },
  {
    val: 'MED',
    label: '보통',
    idle: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
    active: 'bg-amber-500 text-white border-amber-500',
  },
  {
    val: 'HIGH',
    label: '높음',
    idle: 'bg-red-50 text-red-600 border-red-200 hover:border-red-400',
    active: 'bg-red-500 text-white border-red-500',
  },
];

// ─── 유틸: 이번 달 주차 계산 ──────────────────────────────────────────────────

function getWeekOfMonth(date: Date): string {
  const month = date.getMonth();
  const dayOfMonth = date.getDate();
  const firstDay = new Date(date.getFullYear(), month, 1);
  const daysToFirstMonday = firstDay.getDay() === 1 ? 0 : (8 - firstDay.getDay()) % 7;
  if (dayOfMonth < 1 + daysToFirstMonday) return '1주차';
  const weekNum = Math.min(Math.floor((dayOfMonth - (1 + daysToFirstMonday)) / 7) + 1, 5);
  return `${weekNum}주차`;
}

// ─── 폼 상태 타입 ─────────────────────────────────────────────────────────────

interface FormState {
  year: string;
  month: string;
  week_number: string;
  company: string;
  work_type: string;
  project_name: string;
  this_week: string;
  next_week: string;
  progress: number;
  priority: string;
  issues: string;
}

function makeInitialForm(): FormState {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    week_number: getWeekOfMonth(now),
    company: '',
    work_type: '',
    project_name: '',
    this_week: '',
    next_week: '',
    progress: 0,
    priority: '',
    issues: '',
  };
}

// ─── 하위 컴포넌트: SectionLabel ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: BRAND }} />
      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{children}</span>
    </div>
  );
}

// ─── 하위 컴포넌트: FieldLabel ────────────────────────────────────────────────

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-500 mb-2">
      {children}
    </label>
  );
}

// ─── 하위 컴포넌트: ProgressSlider ────────────────────────────────────────────

function ProgressSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const barColor =
    value <= 30 ? '#ef4444' : value <= 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="space-y-3">
      {/* 라벨 + 현재값 */}
      <div className="flex items-center justify-between">
        <FieldLabel>진행률</FieldLabel>
        <span
          className="text-sm font-black tabular-nums"
          style={{ color: BRAND }}
        >
          {value}%
        </span>
      </div>

      {/* 슬라이더 트랙 */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 w-4 shrink-0 text-center">0</span>
        <div className="relative flex-1 py-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, ${barColor} ${value}%, #e2e8f0 ${value}%)`,
              accentColor: BRAND,
            }}
          />
        </div>
        <span className="text-xs font-medium text-slate-400 w-8 shrink-0 text-right">100%</span>
      </div>

      {/* 눈금 */}
      <div className="flex justify-between px-7">
        {[0, 25, 50, 75, 100].map((v) => (
          <div key={v} className="flex flex-col items-center gap-0.5">
            <span className="w-px h-1.5 bg-slate-200" />
            <span className="text-[10px] text-slate-300 font-medium">{v}</span>
          </div>
        ))}
      </div>

      {/* 단계 색상 힌트 */}
      <div className="h-1.5 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-red-200" />
        <div className="flex-1 bg-amber-200" />
        <div className="flex-1 bg-emerald-200" />
      </div>
    </div>
  );
}

// ─── 메인: NewUpdatePopup ─────────────────────────────────────────────────────

interface NewUpdatePopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewUpdatePopup({ onClose, onSuccess }: NewUpdatePopupProps) {
  const [form, setForm] = useState<FormState>(makeInitialForm());
  const [saving, setSaving] = useState(false);
  const [continueAdding, setContinueAdding] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── 공통 인풋 클래스 ─────────────────────────────────────────────────────────
  const inputCls =
    'w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 ' +
    'placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200 ' +
    'focus:border-orange-400 transition-all';

  const textareaCls = cn(inputCls, 'resize-none leading-relaxed');

  // ── 저장 핸들러 ──────────────────────────────────────────────────────────────
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
          priority: form.priority || null,
          issues: form.issues || null,
          status: final ? 'IN PROGRESS' : 'PENDING',
        },
      ];
      await createWeeklyReports(payload);
      toast.success(final ? '주간보고가 최종 등록되었습니다.' : '임시 저장되었습니다.');
      onSuccess();
      if (final || !continueAdding) {
        onClose();
      } else {
        setForm(makeInitialForm());
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 렌더링 ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 상단 컬러 액센트 바 ── */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fff3e8' }}
            >
              <Plus size={17} style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                New Update
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">이번 주 진행 상황을 기록하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl p-1.5 transition-all"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 본문 ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">

          {/* ── 날짜 섹션 ── */}
          <section>
            <SectionLabel>날짜 정보</SectionLabel>
            <div className="grid grid-cols-3 gap-4">
              {/* 연도 */}
              <div>
                <FieldLabel htmlFor="year">연도</FieldLabel>
                <select
                  id="year"
                  value={form.year}
                  onChange={(e) => update('year', e.target.value)}
                  className={inputCls}
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
              {/* 월 */}
              <div>
                <FieldLabel htmlFor="month">월</FieldLabel>
                <select
                  id="month"
                  value={form.month}
                  onChange={(e) => update('month', e.target.value)}
                  className={inputCls}
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
              {/* 주차 */}
              <div>
                <FieldLabel htmlFor="week">주차</FieldLabel>
                <select
                  id="week"
                  value={form.week_number}
                  onChange={(e) => update('week_number', e.target.value)}
                  className={inputCls}
                >
                  {WEEK_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── 2단 그리드 본문 ── */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">

            {/* ════ 좌측 컬럼 ════ */}
            <div className="flex flex-col gap-6">
              <SectionLabel>프로젝트 정보</SectionLabel>

              {/* 업체명 */}
              <div>
                <FieldLabel htmlFor="company">업체명</FieldLabel>
                <select
                  id="company"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className={inputCls}
                >
                  <option value="">업체 선택</option>
                  {COMPANY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 프로젝트명 */}
              <div>
                <FieldLabel htmlFor="project_name">프로젝트명</FieldLabel>
                <input
                  id="project_name"
                  type="text"
                  value={form.project_name}
                  onChange={(e) => update('project_name', e.target.value)}
                  placeholder="프로젝트명 입력 (선택)"
                  className={inputCls}
                />
              </div>

              {/* 금주 진행 사항 — 여유 있는 높이 */}
              <div className="flex flex-col flex-1">
                <FieldLabel htmlFor="this_week">금주 진행 사항</FieldLabel>
                <textarea
                  id="this_week"
                  rows={6}
                  value={form.this_week}
                  onChange={(e) => update('this_week', e.target.value)}
                  placeholder="이번 주에 진행한 업무를 자유롭게 입력하세요&#10;&#10;예) 기능 개발 완료, 코드 리뷰 진행..."
                  className={cn(textareaCls, 'flex-1 min-h-[140px]')}
                />
              </div>

              {/* 진행률 슬라이더 — 넉넉한 상단 여백 */}
              <div className="pt-2 pb-1 bg-slate-50/70 rounded-2xl px-4 py-4">
                <ProgressSlider
                  value={form.progress}
                  onChange={(v) => update('progress', v)}
                />
              </div>
            </div>

            {/* ════ 우측 컬럼 ════ */}
            <div className="flex flex-col gap-6">
              <SectionLabel>업무 상세</SectionLabel>

              {/* 업무 구분 — 칩 토글 */}
              <div>
                <FieldLabel>업무 구분</FieldLabel>
                <div className="flex gap-2.5">
                  {WORK_TYPE_CHIPS.map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('work_type', form.work_type === val ? '' : val)}
                      className={cn(
                        'flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all',
                        form.work_type === val
                          ? 'text-white border-transparent shadow-sm'
                          : 'text-slate-500 border-slate-200 bg-white hover:border-orange-200 hover:text-orange-500',
                      )}
                      style={form.work_type === val ? { backgroundColor: BRAND, borderColor: BRAND } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 차주 계획 — 여유 있는 높이 */}
              <div className="flex flex-col">
                <FieldLabel htmlFor="next_week">차주 계획</FieldLabel>
                <textarea
                  id="next_week"
                  rows={5}
                  value={form.next_week}
                  onChange={(e) => update('next_week', e.target.value)}
                  placeholder="다음 주 주요 계획을 입력하세요&#10;&#10;예) 테스트 작성, 배포 준비..."
                  className={cn(textareaCls, 'min-h-[120px]')}
                />
              </div>

              {/* 특이사항 / 이슈 */}
              <div>
                <FieldLabel htmlFor="issues">특이사항 / 이슈</FieldLabel>
                <textarea
                  id="issues"
                  rows={3}
                  value={form.issues}
                  onChange={(e) => update('issues', e.target.value)}
                  placeholder="이슈나 특이사항을 입력하세요 (선택)"
                  className={textareaCls}
                />
              </div>

              {/* 우선순위 */}
              <div>
                <FieldLabel>우선순위</FieldLabel>
                <div className="flex gap-2.5">
                  {PRIORITY_CHIPS.map(({ val, label, idle, active }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('priority', form.priority === val ? '' : val)}
                      className={cn(
                        'flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all',
                        form.priority === val ? active : idle,
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 푸터 ── */}
        <div className="border-t border-slate-100 px-7 py-4 shrink-0">
          <div className="flex items-center justify-between">
            {/* 저장 후 계속 추가 */}
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={continueAdding}
                  onChange={(e) => setContinueAdding(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    continueAdding
                      ? 'border-transparent'
                      : 'border-slate-300 bg-white group-hover:border-orange-300',
                  )}
                  style={continueAdding ? { backgroundColor: BRAND, borderColor: BRAND } : {}}
                >
                  {continueAdding && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                저장 후 계속 추가
              </span>
            </label>

            {/* 버튼 그룹 */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="text-sm font-semibold text-slate-500 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all disabled:opacity-50"
                style={{ color: BRAND, borderColor: BRAND, backgroundColor: '#fff8f3' }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                임시 저장
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-bold text-white px-5 py-2 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
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
