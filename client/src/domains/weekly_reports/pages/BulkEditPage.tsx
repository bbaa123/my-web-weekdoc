import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { getCurrentWeekInfo } from '@/core/utils/date';
import {
  createWeeklyReports,
  fetchWeeklyReports,
  aiGuideText,
  updateWeeklyReport,
} from '../api';
import type { WeeklyReport, WeeklyReportCreate } from '../types';

// ─── 상수 ─────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const STATUS_OPTIONS = ['진행', '중단', '완료'];
const WORK_TYPE_OPTIONS = ['일반업무', '프로젝트', '기타업무'];
const COMPANY_OPTIONS = ['세아홀딩스', '세아베스틸지주', '세아M&S', '세아특수강'];

// ─── 타입 ─────────────────────────────────────────────────────────────────

interface BulkRow {
  _key: string;
  _fromLastWeek?: boolean;
  _isDirty?: boolean;
  weekly_reports_no?: number;
  work_type: string;
  company: string;
  project_name: string;
  this_week: string;
  next_week: string;
  issues: string;
  progress: number;
  status: string;
}

// Tab 탐색 가능한 컬럼 순서
const COL_ORDER: Array<keyof BulkRow> = [
  'work_type',
  'company',
  'project_name',
  'this_week',
  'next_week',
  'issues',
  'progress',
  'status',
];

// ─── 유틸 ─────────────────────────────────────────────────────────────────

function makePrevWeekInfo(
  year: string,
  month: string,
  weekNumber: string,
): { year: string; month: string; weekNumber: string } {
  const weekNum = parseInt(weekNumber.replace('주차', ''), 10);
  if (weekNum > 1) {
    return { year, month, weekNumber: `${weekNum - 1}주차` };
  }
  const monthNum = parseInt(month, 10);
  if (monthNum > 1) {
    return { year, month: String(monthNum - 1).padStart(2, '0'), weekNumber: '5주차' };
  }
  return { year: String(parseInt(year, 10) - 1), month: '12', weekNumber: '5주차' };
}

function makeEmptyRow(): BulkRow {
  return {
    _key: Math.random().toString(36).slice(2),
    work_type: '',
    company: '',
    project_name: '',
    this_week: '',
    next_week: '',
    issues: '',
    progress: 0,
    status: '',
  };
}

// ─── 오토리사이즈 텍스트에어리어 ───────────────────────────────────────────

function AutoTextarea({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  textareaRef?: React.RefCallback<HTMLTextAreaElement>;
}) {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      if (textareaRef) textareaRef(el);
    },
    [textareaRef],
  );

  const resize = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={setRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resize();
      }}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      placeholder={placeholder}
      rows={2}
      className={className}
      style={{ resize: 'none', overflow: 'hidden', minHeight: '56px' }}
    />
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────

export function BulkEditPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { year, month, weekNumber } = getCurrentWeekInfo();
  const monthNum = parseInt(month, 10);
  const weekNum = parseInt(weekNumber.replace('주차', ''), 10);
  const title = `${year}년 ${monthNum}월 ${weekNum}주차 주간보고 작성`;

  const [rows, setRows] = useState<BulkRow[]>([makeEmptyRow()]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCurrentWeek, setLoadingCurrentWeek] = useState(false);
  const [loadingLastWeek, setLoadingLastWeek] = useState(false);
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Set<string>>(new Set());

  // 셀 ref 맵: rowKey + ':' + colName → ref
  const cellRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // ── 이번 주차 기존 데이터 로드 ──────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    setLoadingCurrentWeek(true);
    fetchWeeklyReports()
      .then((allReports: WeeklyReport[]) => {
        const currentWeekReports = allReports.filter(
          (r) => r.year === year && r.month === month && r.week_number === weekNumber,
        );
        if (currentWeekReports.length > 0) {
          const loaded: BulkRow[] = currentWeekReports.map((r) => ({
            _key: Math.random().toString(36).slice(2),
            _isDirty: false,
            weekly_reports_no: r.weekly_reports_no,
            work_type: r.work_type ?? '',
            company: r.company ?? '',
            project_name: r.project_name ?? '',
            this_week: r.this_week ?? '',
            next_week: r.next_week ?? '',
            issues: r.issues ?? '',
            progress: r.progress ?? 0,
            status: r.status ?? '',
          }));
          setRows(loaded);
        }
      })
      .catch(() => {
        // 로드 실패 시 빈 행 유지
      })
      .finally(() => setLoadingCurrentWeek(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── 행 추가 ─────────────────────────────────────────────────────────────

  const addRow = useCallback(() => {
    const newRow = makeEmptyRow();
    setRows((prev) => [...prev, newRow]);
    setActiveKey(newRow._key);
    setTimeout(() => {
      const el = cellRefs.current.get(`${newRow._key}:work_type`);
      if (el) (el as HTMLElement).focus();
    }, 50);
  }, []);

  // ── 행 삭제 ─────────────────────────────────────────────────────────────

  const removeRow = (key: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r._key !== key);
      return next.length === 0 ? [makeEmptyRow()] : next;
    });
  };

  // ── 셀 값 변경 ──────────────────────────────────────────────────────────

  const updateRow = (key: string, field: keyof BulkRow, value: string | number | boolean) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        const updated = { ...r, [field]: value };
        // 업무유형이 프로젝트가 아니면 프로젝트명 초기화
        if (field === 'work_type' && value !== '프로젝트') {
          updated.project_name = '';
        }
        // 상태가 '완료'면 진행률 자동 100%
        if (field === 'status' && value === '완료') {
          updated.progress = 100;
        }
        // 기존 행(weekly_reports_no 있음)은 수정 시 dirty 표시
        if (r.weekly_reports_no) {
          updated._isDirty = true;
        }
        return updated;
      }),
    );
  };

  // ── Tab 키 네비게이션 ────────────────────────────────────────────────────

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowKey: string,
    colName: keyof BulkRow,
  ) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    const rowIdx = rows.findIndex((r) => r._key === rowKey);
    const colIdx = COL_ORDER.indexOf(colName);
    const isLast = rowIdx === rows.length - 1 && colIdx === COL_ORDER.length - 1;

    if (isLast) {
      addRow();
      return;
    }

    let nextRowKey = rowKey;
    let nextCol = COL_ORDER[colIdx + 1];
    if (colIdx === COL_ORDER.length - 1) {
      nextRowKey = rows[rowIdx + 1]._key;
      nextCol = COL_ORDER[0];
    }

    setTimeout(() => {
      const el = cellRefs.current.get(`${nextRowKey}:${nextCol}`);
      if (el) (el as HTMLElement).focus();
    }, 10);
  };

  // ── 유효성 검사 ─────────────────────────────────────────────────────────

  // 행이 완전히 비어있으면 저장 대상에서 제외 (필수 필드가 모두 비어있는 경우)
  const isRowEmpty = (row: BulkRow) =>
    !row.this_week.trim() && !row.work_type.trim() && !row.company.trim();

  // 저장 대상 행 중에서 필수값 누락 여부
  const isRowInvalid = (row: BulkRow) => !row.this_week.trim();

  // ── 전체 저장 (INSERT + UPDATE) ──────────────────────────────────────────

  const handleSaveAll = async () => {
    const nonEmpty = rows.filter((r) => !isRowEmpty(r));
    if (nonEmpty.length === 0) {
      toast.error('저장할 내용이 없습니다. 최소 한 행을 입력하세요.');
      return;
    }
    const invalid = nonEmpty.filter(isRowInvalid);
    if (invalid.length > 0) {
      toast.error(
        `${invalid.length}개 행의 필수값(금주 진행 사항)이 누락되었습니다. 확인해주세요.`,
      );
      // 첫 번째 오류 행으로 포커스
      setActiveKey(invalid[0]._key);
      return;
    }

    setSaving(true);
    try {
      // 신규(INSERT)와 기존(UPDATE) 분리
      const newRows = nonEmpty.filter((r) => !r.weekly_reports_no);
      const existingRows = nonEmpty.filter((r) => !!r.weekly_reports_no);

      const promises: Promise<unknown>[] = [];

      // 신규 일괄 등록
      if (newRows.length > 0) {
        const payload: WeeklyReportCreate[] = newRows.map((r) => ({
          year,
          month,
          week_number: weekNumber,
          work_type: r.work_type || null,
          company: r.company || null,
          project_name: r.work_type === '프로젝트' ? r.project_name || null : null,
          this_week: r.this_week || null,
          next_week: r.next_week || null,
          issues: r.issues || null,
          progress: r.progress,
          priority: null,
          status: r.status || null,
        }));
        promises.push(createWeeklyReports(payload));
      }

      // 기존 항목 개별 수정
      for (const r of existingRows) {
        promises.push(
          updateWeeklyReport(r.weekly_reports_no!, {
            work_type: r.work_type || null,
            company: r.company || null,
            project_name: r.work_type === '프로젝트' ? r.project_name || null : null,
            this_week: r.this_week || null,
            next_week: r.next_week || null,
            issues: r.issues || null,
            progress: r.progress,
            status: r.status || null,
          }),
        );
      }

      await Promise.all(promises);

      const msg = [
        newRows.length > 0 ? `신규 ${newRows.length}개 등록` : '',
        existingRows.length > 0 ? `기존 ${existingRows.length}개 수정` : '',
      ]
        .filter(Boolean)
        .join(', ');

      toast.success(`저장 완료: ${msg}`);
      navigate('/weekly-sync');
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 이전 주차 미완료 항목 가져오기 ───────────────────────────────────────

  const handleImportLastWeek = async () => {
    setLoadingLastWeek(true);
    try {
      const allReports: WeeklyReport[] = await fetchWeeklyReports();
      const prev = makePrevWeekInfo(year, month, weekNumber);

      const incomplete = allReports.filter(
        (r) =>
          r.year === prev.year &&
          r.month === prev.month &&
          r.week_number === prev.weekNumber &&
          r.status !== 'COMPLETED' &&
          r.status !== '완료',
      );

      if (incomplete.length === 0) {
        toast.error('이전 주차에 미완료 항목이 없습니다.');
        return;
      }

      const imported: BulkRow[] = incomplete.map((r) => ({
        _key: Math.random().toString(36).slice(2),
        _fromLastWeek: true,
        weekly_reports_no: r.weekly_reports_no,
        work_type: r.work_type ?? '',
        company: r.company ?? '',
        project_name: r.project_name ?? '',
        this_week: r.this_week ?? '',
        next_week: r.next_week ?? '',
        issues: r.issues ?? '',
        progress: r.progress ?? 0,
        status: r.status ?? '',
      }));

      setRows((prev) => {
        const hasContent = prev.some(
          (r) =>
            r.this_week.trim() || r.work_type.trim() || r.project_name.trim(),
        );
        return hasContent ? [...prev, ...imported] : imported;
      });

      toast.success(`이전 주차 미완료 항목 ${imported.length}개를 불러왔습니다.`);
    } catch {
      toast.error('이전 주차 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoadingLastWeek(false);
    }
  };

  // ── AI 차주 계획 제안 ────────────────────────────────────────────────────

  const handleAiSummary = async (rowKey: string) => {
    const row = rows.find((r) => r._key === rowKey);
    if (!row?.this_week.trim()) {
      toast.error('금주 진행 사항을 먼저 입력해주세요.');
      return;
    }
    setAiLoadingKeys((prev) => new Set(prev).add(rowKey));
    try {
      const result = await aiGuideText(row.this_week);
      updateRow(rowKey, 'next_week', result.guide);
      toast.success('AI가 차주 계획을 제안했습니다. 수정 후 저장하세요.');
    } catch {
      toast.error('AI 요약 중 오류가 발생했습니다.');
    } finally {
      setAiLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    }
  };

  // ── 공통 셀 스타일 ───────────────────────────────────────────────────────

  const cellCls =
    'w-full text-sm text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1.5 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all ' +
    'placeholder:text-slate-300';

  const disabledCellCls =
    'w-full text-sm text-slate-300 bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 cursor-not-allowed';

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── 고정 헤더 ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div
          className="h-1"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <ChevronLeft size={18} />
          </button>

          {/* 타이틀 */}
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays size={18} style={{ color: BRAND }} className="shrink-0" />
            <h1 className="text-base font-black text-slate-900 truncate">{title}</h1>
          </div>

          {/* 기간 뱃지 */}
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
            style={{ backgroundColor: '#fff3e8', color: BRAND }}
          >
            {year}.{month} {weekNum}주차
          </div>

          <div className="flex-1" />

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleImportLastWeek}
              disabled={loadingLastWeek}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-all"
            >
              {loadingLastWeek ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ChevronLeft size={14} />
              )}
              이전 주차 미완료 가져오기
            </button>

            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Plus size={14} />
              행 추가
            </button>

            <button
              onClick={() => navigate('/weekly-sync')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <X size={14} />
              취소
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              전체 저장
            </button>
          </div>
        </div>
      </header>

      {/* ── 메인 그리드 ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-6 py-6">
        {loadingCurrentWeek && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600 font-medium">
            <Loader2 size={14} className="animate-spin shrink-0" />
            이번 주차 등록된 보고서를 불러오는 중...
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 가로 스크롤 컨테이너 */}
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse" style={{ minWidth: '1500px' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* # */}
                  <th className="w-10 px-3 py-3 text-xs font-bold text-slate-400 text-center sticky left-0 bg-slate-50 z-10">
                    #
                  </th>
                  {/* 업무유형 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[120px]">
                    업무유형
                    <span className="ml-1 text-red-400">*</span>
                  </th>
                  {/* 업체명 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[130px]">
                    업체명
                  </th>
                  {/* 프로젝트명 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[150px]">
                    프로젝트명
                    <span className="ml-1 text-xs font-normal text-slate-400">(프로젝트 시)</span>
                  </th>
                  {/* 금주 진행 사항 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[280px]">
                    금주 진행 사항
                    <span className="ml-1 text-red-400">*</span>
                  </th>
                  {/* 차주 계획 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[220px]">
                    차주 계획
                  </th>
                  {/* 특이사항 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[160px]">
                    특이사항 / 이슈
                  </th>
                  {/* 진행률 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center min-w-[80px]">
                    진행률
                  </th>
                  {/* 상태 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center min-w-[130px]">
                    상태
                  </th>
                  {/* AI */}
                  <th
                    className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-center min-w-[50px]"
                    style={{ color: BRAND }}
                  >
                    AI
                  </th>
                  {/* 삭제 */}
                  <th className="px-3 py-3 text-xs font-bold text-slate-400 text-center w-10">
                    삭제
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const isActive = activeKey === row._key;
                  const isInvalid =
                    !isRowEmpty(row) && isRowInvalid(row);
                  const isAiLoading = aiLoadingKeys.has(row._key);
                  const isProject = row.work_type === '프로젝트';
                  const isDirtyExisting = !!row.weekly_reports_no && !!row._isDirty;

                  return (
                    <tr
                      key={row._key}
                      onClick={() => setActiveKey(row._key)}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-orange-50/60'
                          : isDirtyExisting
                            ? 'bg-blue-50/50 hover:bg-blue-50/70'
                            : 'hover:bg-slate-50/60'
                      } ${isInvalid ? 'bg-red-50/40' : ''}`}
                      style={
                        isActive
                          ? { boxShadow: `inset 4px 0 0 ${BRAND}` }
                          : isDirtyExisting
                            ? { boxShadow: 'inset 4px 0 0 #3b82f6' }
                            : undefined
                      }
                    >
                      {/* 행 번호 */}
                      <td className="px-3 py-2 text-xs text-slate-400 text-center align-top pt-3 select-none sticky left-0 bg-inherit z-10">
                        {idx + 1}
                        {row._fromLastWeek && (
                          <div
                            className="mt-0.5 text-[9px] font-bold"
                            style={{ color: BRAND }}
                            title="이전 주차에서 가져온 항목"
                          >
                            이전
                          </div>
                        )}
                        {row.weekly_reports_no && (
                          <div className="mt-0.5 text-[9px] text-slate-300">
                            #{row.weekly_reports_no}
                          </div>
                        )}
                        {isDirtyExisting && (
                          <div className="mt-0.5 text-[9px] font-bold text-blue-500">
                            수정중
                          </div>
                        )}
                      </td>

                      {/* 업무유형 */}
                      <td className="px-3 py-2 align-top">
                        <select
                          ref={(el) =>
                            cellRefs.current.set(`${row._key}:work_type`, el)
                          }
                          value={row.work_type}
                          onChange={(e) =>
                            updateRow(row._key, 'work_type', e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, row._key, 'work_type')
                          }
                          onFocus={() => setActiveKey(row._key)}
                          className={cellCls + ' cursor-pointer'}
                        >
                          <option value="">유형 선택</option>
                          {WORK_TYPE_OPTIONS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 업체명 */}
                      <td className="px-3 py-2 align-top">
                        <select
                          ref={(el) =>
                            cellRefs.current.set(`${row._key}:company`, el)
                          }
                          value={row.company}
                          onChange={(e) =>
                            updateRow(row._key, 'company', e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, row._key, 'company')
                          }
                          onFocus={() => setActiveKey(row._key)}
                          className={cellCls + ' cursor-pointer'}
                        >
                          <option value="">업체 선택</option>
                          {COMPANY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 프로젝트명 — 업무유형이 '프로젝트'일 때만 활성 */}
                      <td className="px-3 py-2 align-top">
                        {isProject ? (
                          <input
                            ref={(el) =>
                              cellRefs.current.set(`${row._key}:project_name`, el)
                            }
                            type="text"
                            value={row.project_name}
                            onChange={(e) =>
                              updateRow(row._key, 'project_name', e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleCellKeyDown(e, row._key, 'project_name')
                            }
                            onFocus={() => setActiveKey(row._key)}
                            placeholder="프로젝트명 입력"
                            className={cellCls}
                          />
                        ) : (
                          <input
                            tabIndex={-1}
                            type="text"
                            value=""
                            readOnly
                            placeholder="업무유형 '프로젝트' 선택 시 입력"
                            className={disabledCellCls}
                          />
                        )}
                      </td>

                      {/* 금주 진행 사항 */}
                      <td
                        className={`px-3 py-2 align-top ${
                          isInvalid ? 'ring-1 ring-inset ring-red-300 rounded-md' : ''
                        }`}
                      >
                        <AutoTextarea
                          textareaRef={(el) => {
                            if (el)
                              cellRefs.current.set(`${row._key}:this_week`, el);
                          }}
                          value={row.this_week}
                          onChange={(v) => updateRow(row._key, 'this_week', v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab')
                              handleCellKeyDown(e, row._key, 'this_week');
                          }}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="이번 주 진행 사항을 입력하세요"
                          className={`${cellCls} leading-snug`}
                        />
                        {isInvalid && (
                          <p className="mt-1 text-[10px] text-red-400 font-medium">
                            필수 입력값입니다
                          </p>
                        )}
                      </td>

                      {/* 차주 계획 */}
                      <td className="px-3 py-2 align-top">
                        <AutoTextarea
                          textareaRef={(el) => {
                            if (el)
                              cellRefs.current.set(`${row._key}:next_week`, el);
                          }}
                          value={row.next_week}
                          onChange={(v) => updateRow(row._key, 'next_week', v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab')
                              handleCellKeyDown(e, row._key, 'next_week');
                          }}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="다음 주 계획"
                          className={`${cellCls} leading-snug`}
                        />
                      </td>

                      {/* 특이사항 / 이슈 */}
                      <td className="px-3 py-2 align-top">
                        <AutoTextarea
                          textareaRef={(el) => {
                            if (el)
                              cellRefs.current.set(`${row._key}:issues`, el);
                          }}
                          value={row.issues}
                          onChange={(v) => updateRow(row._key, 'issues', v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab')
                              handleCellKeyDown(e, row._key, 'issues');
                          }}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="이슈 또는 특이사항"
                          className={`${cellCls} leading-snug`}
                        />
                      </td>

                      {/* 진행률 */}
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            ref={(el) =>
                              cellRefs.current.set(`${row._key}:progress`, el)
                            }
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={row.progress}
                            onChange={(e) =>
                              updateRow(
                                row._key,
                                'progress',
                                Math.max(0, Math.min(100, Number(e.target.value))),
                              )
                            }
                            onKeyDown={(e) =>
                              handleCellKeyDown(e, row._key, 'progress')
                            }
                            onFocus={() => setActiveKey(row._key)}
                            className={`${cellCls} text-center`}
                          />
                          {/* 진행률 미니 바 */}
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${row.progress}%`,
                                backgroundColor:
                                  row.progress <= 30
                                    ? '#ef4444'
                                    : row.progress <= 70
                                      ? '#f59e0b'
                                      : '#10b981',
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: BRAND }}
                          >
                            {row.progress}%
                          </span>
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-3 py-2 align-top">
                        <select
                          ref={(el) =>
                            cellRefs.current.set(`${row._key}:status`, el)
                          }
                          value={row.status}
                          onChange={(e) =>
                            updateRow(row._key, 'status', e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, row._key, 'status')
                          }
                          onFocus={() => setActiveKey(row._key)}
                          className={`${cellCls} cursor-pointer`}
                          style={
                            row.status === '완료'
                              ? { color: '#10b981', fontWeight: 700 }
                              : row.status === '진행'
                                ? { color: '#3b82f6', fontWeight: 700 }
                                : row.status === '중단'
                                  ? { color: '#ef4444', fontWeight: 700 }
                                  : {}
                          }
                        >
                          <option value="">상태 선택</option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* AI 차주 계획 제안 */}
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAiSummary(row._key);
                          }}
                          disabled={isAiLoading || !row.this_week.trim()}
                          title={
                            !row.this_week.trim()
                              ? '금주 진행 사항을 입력하면 AI 제안을 받을 수 있습니다'
                              : 'AI가 차주 계획을 제안합니다'
                          }
                          className="mt-1 p-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                          style={{
                            color: BRAND,
                            borderColor: BRAND,
                            backgroundColor: '#fff8f3',
                          }}
                        >
                          {isAiLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Bot size={13} />
                          )}
                        </button>
                      </td>

                      {/* 삭제 */}
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRow(row._key);
                          }}
                          className="mt-1 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                          title="행 삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 행 추가 버튼 (테이블 하단) */}
          <div className="border-t border-slate-100 px-4 py-3">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus size={13} />
              행 추가 (Tab 키로도 추가됩니다)
            </button>
          </div>
        </div>

        {/* 하단 범례 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: BRAND, opacity: 0.8 }}
            />
            작성 중인 행 (주황색 라인)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm border border-blue-300 bg-blue-50" />
            수정 중인 기존 행 (파란색 라인)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm border border-red-300 bg-red-50" />
            필수값 누락 — 금주 진행 사항이 비어있는 행
          </span>
          <span className="flex items-center gap-1.5">
            <Bot size={12} style={{ color: BRAND }} />
            AI: 금주 진행 사항 입력 후 클릭 → 차주 계획 자동 제안
          </span>
          <span>Tab 키로 다음 칸 이동, 마지막 칸에서 Tab → 새 행 자동 추가</span>
          <span>
            <span className="font-semibold text-slate-500">* 표시</span>는 필수 입력 항목 /
            프로젝트명은 업무유형이 &apos;프로젝트&apos;일 때만 입력 가능 /
            상태를 &apos;완료&apos;로 선택하면 진행률이 자동으로 100%가 됩니다
          </span>
        </div>
      </main>
    </div>
  );
}
