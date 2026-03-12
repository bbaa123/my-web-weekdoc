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
} from '../api';
import type { WeeklyReport, WeeklyReportCreate } from '../types';

// ─── 상수 ─────────────────────────────────────────────────────────────────

const BRAND = '#FF6B00';

const STATUS_OPTIONS = ['IN PROGRESS', 'COMPLETED', 'PENDING', 'DELAYED'];

// ─── 타입 ─────────────────────────────────────────────────────────────────

interface BulkRow {
  _key: string;
  project_name: string;
  this_week: string;
  next_week: string;
  progress: number;
  status: string;
  // from previous week import
  _fromLastWeek?: boolean;
}

function makePrevWeekInfo(year: string, month: string, weekNumber: string): {
  year: string;
  month: string;
  weekNumber: string;
} {
  const weekNum = parseInt(weekNumber.replace('주차', ''), 10);
  if (weekNum > 1) {
    return { year, month, weekNumber: `${weekNum - 1}주차` };
  }
  // 1주차 → 이전 달 마지막 주차
  const monthNum = parseInt(month, 10);
  if (monthNum > 1) {
    return { year, month: String(monthNum - 1).padStart(2, '0'), weekNumber: '5주차' };
  }
  // 1월 1주차 → 이전 연도 12월 5주차
  return {
    year: String(parseInt(year, 10) - 1),
    month: '12',
    weekNumber: '5주차',
  };
}

function makeEmptyRow(): BulkRow {
  return {
    _key: Math.random().toString(36).slice(2),
    project_name: '',
    this_week: '',
    next_week: '',
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
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
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
  const [loadingLastWeek, setLoadingLastWeek] = useState(false);
  const [aiLoadingKeys, setAiLoadingKeys] = useState<Set<string>>(new Set());

  // 셀 ref 맵: rowKey + colName → ref
  const cellRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // ── 행 추가 ─────────────────────────────────────────────────────────────

  const addRow = useCallback(() => {
    const newRow = makeEmptyRow();
    setRows((prev) => [...prev, newRow]);
    setActiveKey(newRow._key);
    // 다음 tick에 첫 셀 포커스
    setTimeout(() => {
      const el = cellRefs.current.get(`${newRow._key}:project_name`);
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

  const updateRow = (key: string, field: keyof BulkRow, value: string | number) => {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  };

  // ── Tab 키 네비게이션 ────────────────────────────────────────────────────

  const COL_ORDER: Array<keyof BulkRow> = [
    'project_name',
    'this_week',
    'next_week',
    'progress',
    'status',
  ];

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowKey: string,
    colName: keyof BulkRow
  ) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    const rowIdx = rows.findIndex((r) => r._key === rowKey);
    const colIdx = COL_ORDER.indexOf(colName);
    const isLast = rowIdx === rows.length - 1 && colIdx === COL_ORDER.length - 1;

    if (isLast) {
      // 마지막 칸에서 Tab → 새 행 추가
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

  const isRowInvalid = (row: BulkRow) => !row.this_week.trim() && !row.project_name.trim();

  // ── 전체 저장 ────────────────────────────────────────────────────────────

  const handleSaveAll = async () => {
    const nonEmpty = rows.filter((r) => r.this_week.trim() || r.project_name.trim());
    if (nonEmpty.length === 0) {
      toast.error('저장할 내용이 없습니다. 최소 한 행을 입력하세요.');
      return;
    }
    const invalid = nonEmpty.filter(isRowInvalid);
    if (invalid.length > 0) {
      toast.error('필수 항목(프로젝트 또는 금주 진행 사항)을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const payload: WeeklyReportCreate[] = nonEmpty.map((r) => ({
        year,
        month,
        week_number: weekNumber,
        company: null,
        work_type: null,
        project_name: r.project_name || null,
        this_week: r.this_week || null,
        next_week: r.next_week || null,
        progress: r.progress,
        priority: null,
        issues: null,
        status: r.status || null,
      }));
      await createWeeklyReports(payload);
      toast.success(`${payload.length}개 주간보고가 등록되었습니다.`);
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
          r.status !== '완료'
      );

      if (incomplete.length === 0) {
        toast.error('이전 주차에 미완료 항목이 없습니다.');
        return;
      }

      const imported: BulkRow[] = incomplete.map((r) => ({
        _key: Math.random().toString(36).slice(2),
        project_name: r.project_name ?? '',
        this_week: r.this_week ?? '',
        next_week: r.next_week ?? '',
        progress: r.progress ?? 0,
        status: r.status ?? '',
        _fromLastWeek: true,
      }));

      setRows((prev) => {
        // 빈 행만 있으면 교체, 아니면 추가
        const hasContent = prev.some(
          (r) => r.project_name.trim() || r.this_week.trim()
        );
        return hasContent ? [...prev, ...imported] : imported;
      });

      toast.success(
        `이전 주차 미완료 항목 ${imported.length}개를 불러왔습니다.`
      );
    } catch {
      toast.error('이전 주차 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoadingLastWeek(false);
    }
  };

  // ── AI 요약 (행별) ───────────────────────────────────────────────────────

  const handleAiSummary = async (rowKey: string) => {
    const row = rows.find((r) => r._key === rowKey);
    if (!row?.this_week.trim()) {
      toast.error('금주 진행 사항을 먼저 입력해주세요.');
      return;
    }
    setAiLoadingKeys((prev) => new Set(prev).add(rowKey));
    try {
      const result = await aiGuideText(row.this_week);
      // AI 가이드 결과를 next_week에 제안으로 채우기
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

  // ── 셀 공통 스타일 ───────────────────────────────────────────────────────

  const cellCls =
    'w-full text-sm text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder:text-slate-300';

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── 고정 헤더 ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm"
      >
        {/* 오렌지 상단 액센트 바 */}
        <div
          className="h-1"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
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

          {/* 스페이서 */}
          <div className="flex-1" />

          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 이전 주차 미완료 항목 가져오기 */}
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

            {/* 행 추가 */}
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Plus size={14} />
              행 추가
            </button>

            {/* 취소 */}
            <button
              onClick={() => navigate('/weekly-sync')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <X size={14} />
              취소
            </button>

            {/* 전체 저장 */}
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
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-8 px-3 py-3 text-xs font-bold text-slate-400 text-center">
                    #
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[140px]">
                    프로젝트
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[300px]">
                    금주 진행 사항
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-left min-w-[240px]">
                    차주 계획
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center min-w-[90px]">
                    진행률
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center min-w-[130px]">
                    상태
                  </th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-center min-w-[60px]"
                    style={{ color: BRAND }}>
                    AI
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-400 text-center w-10">
                    삭제
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => {
                  const isActive = activeKey === row._key;
                  const invalid = isRowInvalid(row) && (row.project_name !== '' || row.this_week !== '');
                  const isAiLoading = aiLoadingKeys.has(row._key);

                  return (
                    <tr
                      key={row._key}
                      onClick={() => setActiveKey(row._key)}
                      className={`transition-colors ${
                        isActive ? 'bg-orange-50/60' : 'hover:bg-slate-50/60'
                      } ${invalid ? 'bg-red-50/40' : ''}`}
                      style={
                        isActive
                          ? { boxShadow: `inset 4px 0 0 ${BRAND}` }
                          : undefined
                      }
                    >

                      {/* 행 번호 */}
                      <td className="px-3 py-2 text-xs text-slate-400 text-center align-top pt-3 select-none">
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
                      </td>

                      {/* 프로젝트 */}
                      <td className={`px-3 py-2 align-top ${invalid ? 'border border-red-300 rounded-md' : ''}`}>
                        <input
                          ref={(el) => cellRefs.current.set(`${row._key}:project_name`, el)}
                          type="text"
                          value={row.project_name}
                          onChange={(e) => updateRow(row._key, 'project_name', e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, row._key, 'project_name')}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="프로젝트명"
                          className={cellCls}
                        />
                      </td>

                      {/* 금주 진행 사항 — auto-resize */}
                      <td className={`px-3 py-2 align-top ${invalid ? 'border border-red-300 rounded-md' : ''}`}>
                        <AutoTextarea
                          value={row.this_week}
                          onChange={(v) => updateRow(row._key, 'this_week', v)}
                          onKeyDown={(e) => {
                            // Tab만 인터셉트
                            if (e.key === 'Tab') handleCellKeyDown(e, row._key, 'this_week');
                          }}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="이번 주 진행 사항을 입력하세요"
                          className={`${cellCls} leading-snug`}
                        />
                      </td>

                      {/* 차주 계획 */}
                      <td className="px-3 py-2 align-top">
                        <AutoTextarea
                          value={row.next_week}
                          onChange={(v) => updateRow(row._key, 'next_week', v)}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') handleCellKeyDown(e, row._key, 'next_week');
                          }}
                          onFocus={() => setActiveKey(row._key)}
                          placeholder="다음 주 계획"
                          className={`${cellCls} leading-snug`}
                        />
                      </td>

                      {/* 진행률 */}
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            ref={(el) => cellRefs.current.set(`${row._key}:progress`, el)}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={row.progress}
                            onChange={(e) =>
                              updateRow(
                                row._key,
                                'progress',
                                Math.max(0, Math.min(100, Number(e.target.value)))
                              )
                            }
                            onKeyDown={(e) => handleCellKeyDown(e, row._key, 'progress')}
                            onFocus={() => setActiveKey(row._key)}
                            className={`${cellCls} text-center w-full`}
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
                          <span className="text-[10px] font-bold" style={{ color: BRAND }}>
                            {row.progress}%
                          </span>
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-3 py-2 align-top">
                        <select
                          ref={(el) => cellRefs.current.set(`${row._key}:status`, el)}
                          value={row.status}
                          onChange={(e) => updateRow(row._key, 'status', e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, row._key, 'status')}
                          onFocus={() => setActiveKey(row._key)}
                          className={`${cellCls} cursor-pointer`}
                        >
                          <option value="">상태 선택</option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* AI 요약 아이콘 */}
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

        {/* 안내 메시지 */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: BRAND, opacity: 0.8 }}
            />
            작성 중인 행 (주황색 라인)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm border border-red-300 bg-red-50" />
            필수 항목 누락 (빨간색 테두리)
          </span>
          <span className="flex items-center gap-1.5">
            <Bot size={12} style={{ color: BRAND }} />
            AI 요약: 금주 진행 사항 입력 후 클릭하면 차주 계획을 제안합니다
          </span>
          <span>Tab 키로 다음 칸 이동, 마지막 칸에서 Tab하면 새 행 자동 추가</span>
        </div>
      </main>
    </div>
  );
}
