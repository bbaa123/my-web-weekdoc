/**
 * NewUpdatePopup — Diary-style Wide Modal
 *
 * Layout:
 *   [Header: New Update title + compact date selectors]
 *   ─────────────────────────────────────────────────────────────────
 *   [Left 40%]                          [Right 60%]
 *   금주 업무 (note-style textarea)      업체명 + 프로젝트명 (select/input)
 *   차주 계획 (note-style textarea)      업무 구분 (chips)
 *                                        진행률 (big orange slider)
 *                                        우선순위 (chips)
 *                                        특이사항 (textarea)
 *   ─────────────────────────────────────────────────────────────────
 *   [Footer: 저장 후 계속 추가 | 취소 | 임시저장(gray) | 최종등록(orange)]
 *
 * Interactive:
 *   - 진행률 숫자: progress > 0 → 큰 주황색 숫자로 강조
 *   - 포커스 시: 왼쪽 주황색 라인 표시 (border-l-4)
 *   - 금주 업무 포커스 시: AI 가이드 placeholder 표시
 *
 * Responsive: sm 미만 → 모든 항목 세로 나열
 */

import { useState } from 'react';
import { Bot, Loader2, Plus, Save, X } from 'lucide-react';
import { toast } from '@/core/utils/toast';
import { cn } from '@/core/utils/cn';
import { createWeeklyReports, aiGuideText } from '../api';
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

const STATUS_CHIPS = [
  {
    val: '진행',
    label: '진행',
    idle: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400',
    active: 'bg-blue-500 text-white border-blue-500',
  },
  {
    val: '중단',
    label: '중단',
    idle: 'bg-red-50 text-red-600 border-red-200 hover:border-red-400',
    active: 'bg-red-500 text-white border-red-500',
  },
  {
    val: '완료',
    label: '완료',
    idle: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400',
    active: 'bg-emerald-500 text-white border-emerald-500',
  },
];

// 금주 업무 포커스 시 AI 가이드 placeholder
const THIS_WEEK_GUIDE_PLACEHOLDER =
  '📝 이렇게 적어보세요:\n' +
  '• 완료한 주요 업무 (예: OO 기능 개발 완료)\n' +
  '• 현재 진행 중인 작업 현황\n' +
  '• 협업하거나 지원한 업무 내용\n' +
  '• 성과나 수치가 있다면 함께 기록해요';

const THIS_WEEK_DEFAULT_PLACEHOLDER = '이번 주 진행한 업무를 자유롭게 입력하세요...';

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
  status: string;
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
    status: '',
    issues: '',
  };
}

// ─── 하위 컴포넌트: NoteField ─────────────────────────────────────────────────
// 왼쪽 주황 라인 포커스 표시기 래퍼

function NoteField({
  focused,
  sectionTag,
  title,
  children,
}: {
  focused: boolean;
  sectionTag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'pl-4 border-l-4 transition-all duration-200',
        focused ? 'border-orange-400' : 'border-transparent',
      )}
    >
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        {sectionTag}
      </p>
      <p className="text-xl font-black text-slate-800 mb-3">{title}</p>
      {children}
    </div>
  );
}

// ─── 하위 컴포넌트: 날짜 셀렉트 (헤더용 compact) ─────────────────────────────

const dateSelectCls =
  'text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white ' +
  'focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all';

// ─── 하위 컴포넌트: 일반 인풋/셀렉트 스타일 ──────────────────────────────────

const fieldCls =
  'w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 ' +
  'placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200 ' +
  'focus:border-orange-400 transition-all';

// ─── 메인: NewUpdatePopup ─────────────────────────────────────────────────────

interface NewUpdatePopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewUpdatePopup({ onClose, onSuccess }: NewUpdatePopupProps) {
  const [form, setForm] = useState<FormState>(makeInitialForm());
  const [saving, setSaving] = useState(false);
  const [continueAdding, setContinueAdding] = useState(false);
  const [aiGuideLoading, setAiGuideLoading] = useState(false);
  const [aiGuideResult, setAiGuideResult] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // 상태가 '완료'면 진행률 자동 100%
      if (field === 'status' && value === '완료') {
        updated.progress = 100;
      }
      return updated;
    });

  const focus = (field: string) => setFocusedField(field);
  const blur = () => setFocusedField(null);

  // ── AI 가이드 핸들러 ─────────────────────────────────────────────────────────
  const handleAiGuide = async () => {
    if (!form.this_week.trim()) {
      toast.error('금주 진행 사항을 먼저 입력해주세요.');
      return;
    }
    setAiGuideLoading(true);
    setAiGuideResult(null);
    try {
      const result = await aiGuideText(form.this_week);
      setAiGuideResult(result.guide);
    } catch {
      toast.error('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAiGuideLoading(false);
    }
  };

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
          priority: null,
          issues: form.issues || null,
          status: form.status || (final ? '진행' : null),
        },
      ];
      await createWeeklyReports(payload);
      toast.success(final ? '주간보고가 최종 등록되었습니다.' : '임시 저장되었습니다.');
      onSuccess();
      if (final || !continueAdding) {
        onClose();
      } else {
        setForm(makeInitialForm());
        setAiGuideResult(null);
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
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col"
        style={{
          boxShadow:
            '0 8px 60px rgba(255, 107, 0, 0.15), 0 2px 20px rgba(0, 0, 0, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 상단 컬러 액센트 바 ── */}
        <div
          className="h-1.5 rounded-t-2xl shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        {/* ── 헤더: 타이틀 + compact 날짜 셀렉터 ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fff3e8' }}
            >
              <Plus size={17} style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">New Update</h2>
              <p className="text-xs text-slate-400 mt-0.5">일기 쓰듯 편안하게 이번 주를 기록하세요</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 날짜 셀렉터 (헤더 우측 compact) */}
            <select
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
              className={dateSelectCls}
              aria-label="연도"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              value={form.month}
              onChange={(e) => update('month', e.target.value)}
              className={dateSelectCls}
              aria-label="월"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
            <select
              value={form.week_number}
              onChange={(e) => update('week_number', e.target.value)}
              className={dateSelectCls}
              aria-label="주차"
            >
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <button
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl p-1.5 transition-all"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 본문: 좌우 분할 ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row min-h-full">

            {/* ════ 좌측 패널 (40%) — 노트 스타일 ════ */}
            <div className="w-full sm:w-2/5 px-8 py-7 flex flex-col gap-8 border-b sm:border-b-0 sm:border-r border-slate-100">

              {/* 금주 업무 */}
              <NoteField
                focused={focusedField === 'this_week'}
                sectionTag="이번 주 기록"
                title="금주 업무"
              >
                {/* AI 어시스턴트 버튼 */}
                <div className="flex items-center justify-end mb-2">
                  <button
                    type="button"
                    onClick={handleAiGuide}
                    disabled={aiGuideLoading}
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-60"
                    style={{ color: BRAND, borderColor: '#FFD5B5', backgroundColor: '#fff8f3' }}
                  >
                    {aiGuideLoading ? (
                      <Loader2 size={11} className="animate-spin" style={{ color: BRAND }} />
                    ) : (
                      <Bot size={11} />
                    )}
                    AI 도움
                  </button>
                </div>

                <textarea
                  id="this_week"
                  rows={8}
                  value={form.this_week}
                  onChange={(e) => update('this_week', e.target.value)}
                  onFocus={() => focus('this_week')}
                  onBlur={blur}
                  placeholder={
                    focusedField === 'this_week'
                      ? THIS_WEEK_GUIDE_PLACEHOLDER
                      : THIS_WEEK_DEFAULT_PLACEHOLDER
                  }
                  className={cn(
                    'w-full text-sm text-slate-800 bg-transparent resize-none leading-[1.9]',
                    'border-0 border-b-2 rounded-none pb-2 focus:outline-none transition-colors',
                    focusedField === 'this_week'
                      ? 'border-orange-400 placeholder:text-orange-200'
                      : 'border-slate-200 placeholder:text-slate-300',
                  )}
                />

                {/* AI 로딩 */}
                {aiGuideLoading && (
                  <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl border border-orange-200 bg-orange-50">
                    <Loader2 size={14} className="animate-spin shrink-0" style={{ color: BRAND }} />
                    <span className="text-xs font-medium" style={{ color: BRAND }}>
                      AI가 가이드를 분석 중...
                    </span>
                  </div>
                )}

                {/* AI 결과 */}
                {aiGuideResult && !aiGuideLoading && (
                  <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot size={12} style={{ color: BRAND }} />
                      <span className="text-xs font-bold" style={{ color: BRAND }}>
                        AI 보완 가이드
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed whitespace-pre-wrap"
                      style={{ color: '#c2440e' }}
                    >
                      {aiGuideResult}
                    </p>
                  </div>
                )}
              </NoteField>

              {/* 차주 계획 */}
              <NoteField
                focused={focusedField === 'next_week'}
                sectionTag="다음 주 계획"
                title="차주 계획"
              >
                <textarea
                  id="next_week"
                  rows={6}
                  value={form.next_week}
                  onChange={(e) => update('next_week', e.target.value)}
                  onFocus={() => focus('next_week')}
                  onBlur={blur}
                  placeholder="다음 주 주요 계획을 입력하세요..."
                  className={cn(
                    'w-full text-sm text-slate-800 bg-transparent resize-none leading-[1.9]',
                    'border-0 border-b-2 rounded-none pb-2 focus:outline-none transition-colors',
                    focusedField === 'next_week'
                      ? 'border-orange-400 placeholder:text-orange-200'
                      : 'border-slate-200 placeholder:text-slate-300',
                  )}
                />
              </NoteField>
            </div>

            {/* ════ 우측 패널 (60%) ════ */}
            <div className="w-full sm:w-3/5 px-8 py-7 flex flex-col gap-6">

              {/* 프로젝트 선택 */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  프로젝트 정보
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="company">
                      업체명
                    </label>
                    <select
                      id="company"
                      value={form.company}
                      onChange={(e) => update('company', e.target.value)}
                      onFocus={() => focus('company')}
                      onBlur={blur}
                      className={fieldCls}
                    >
                      <option value="">업체 선택</option>
                      {COMPANY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5" htmlFor="project_name">
                      프로젝트명
                    </label>
                    <input
                      id="project_name"
                      type="text"
                      value={form.project_name}
                      onChange={(e) => update('project_name', e.target.value)}
                      onFocus={() => focus('project_name')}
                      onBlur={blur}
                      placeholder="프로젝트명 입력 (선택)"
                      className={fieldCls}
                    />
                  </div>
                </div>
              </div>

              {/* 업무 구분 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">업무 구분</label>
                <div className="flex gap-2">
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

              {/* 진행률 슬라이더 */}
              <div className="bg-slate-50/80 rounded-2xl px-5 py-4">
                <div className="flex items-end justify-between mb-3">
                  <label className="text-xs font-semibold text-slate-500">진행률</label>
                  {/* 진행률 숫자 — progress > 0 시 크고 주황색으로 강조 */}
                  <span
                    className="font-black tabular-nums leading-none transition-all duration-300"
                    style={{
                      color: BRAND,
                      fontSize: form.progress > 0 ? '2rem' : '1.125rem',
                    }}
                  >
                    {form.progress}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 w-4 text-center shrink-0">0</span>
                  <div className="relative flex-1 py-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={form.progress}
                      onChange={(e) => update('progress', Number(e.target.value))}
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                      style={{
                        background: `linear-gradient(to right, ${BRAND} ${form.progress}%, #e2e8f0 ${form.progress}%)`,
                        accentColor: BRAND,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 w-8 text-right shrink-0">100%</span>
                </div>

                {/* 눈금 */}
                <div className="flex justify-between px-7 mt-1">
                  {[0, 25, 50, 75, 100].map((v) => (
                    <div key={v} className="flex flex-col items-center gap-0.5">
                      <span className="w-px h-1.5 bg-slate-200" />
                      <span className="text-[10px] text-slate-300 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">상태</label>
                <div className="flex gap-2">
                  {STATUS_CHIPS.map(({ val, label, idle, active }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => update('status', form.status === val ? '' : val)}
                      className={cn(
                        'flex-1 text-xs font-bold py-2.5 rounded-xl border transition-all',
                        form.status === val ? active : idle,
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 특이사항 / 이슈 — 포커스 시 왼쪽 주황 라인 */}
              <div
                className={cn(
                  'pl-4 border-l-4 transition-all duration-200',
                  focusedField === 'issues' ? 'border-orange-400' : 'border-transparent',
                )}
              >
                <label
                  className="block text-xs font-semibold text-slate-500 mb-2"
                  htmlFor="issues"
                >
                  특이사항 / 이슈
                </label>
                <textarea
                  id="issues"
                  rows={4}
                  value={form.issues}
                  onChange={(e) => update('issues', e.target.value)}
                  onFocus={() => focus('issues')}
                  onBlur={blur}
                  placeholder="이슈나 특이사항을 입력하세요 (선택)"
                  className={cn(fieldCls, 'resize-none leading-relaxed')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 하단 액션바 ── */}
        <div className="border-t border-slate-100 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">

            {/* 저장 후 계속 추가 체크박스 */}
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
            <div className="flex items-center gap-2.5 ml-auto">
              {/* 취소 */}
              <button
                onClick={onClose}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all"
              >
                취소
              </button>

              {/* 임시 저장 — 회색 톤 */}
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                임시 저장
              </button>

              {/* 최종 등록 — 선명한 주황색 */}
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm font-bold text-white px-6 py-2 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                최종 등록
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
