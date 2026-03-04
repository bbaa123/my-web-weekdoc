import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Send } from 'lucide-react';
import type { WorkType, Priority, ReportFormData } from '../types';
import { PrioritySelector } from './PrioritySelector';
import { ProgressSlider } from './ProgressSlider';

const DRAFT_KEY = 'weeklyreport-draft';

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: '일반', label: '일반 업무' },
  { value: '프로젝트', label: '프로젝트' },
  { value: '지원', label: '지원 업무' },
  { value: '기타', label: '기타' },
];

const DEFAULT_FORM: ReportFormData = {
  workType: '일반',
  summary: '',
  progress: 0,
  priority: '중',
  issues: '',
};

interface ReportFormProps {
  onSubmit?: (data: ReportFormData) => void;
}

export function ReportForm({ onSubmit }: ReportFormProps) {
  const [formData, setFormData] = useState<ReportFormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? (JSON.parse(saved) as ReportFormData) : DEFAULT_FORM;
    } catch {
      return DEFAULT_FORM;
    }
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
    }, 900);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData]);

  const update = useCallback(
    <K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) => {
      setFormData((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'workType' && value !== '프로젝트') {
          next.projectName = undefined;
        }
        return next;
      });
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem(DRAFT_KEY);
    onSubmit?.(formData);
  };

  const isProject = formData.workType === '프로젝트';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 업무 유형 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">업무 유형</label>
        <select
          value={formData.workType}
          onChange={(e) => update('workType', e.target.value as WorkType)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
        >
          {WORK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 프로젝트명 (Progressive Disclosure) */}
      <AnimatePresence>
        {isProject && (
          <motion.div
            key="project-name-field"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              프로젝트명
            </label>
            <input
              type="text"
              placeholder="프로젝트명을 입력하세요"
              value={formData.projectName ?? ''}
              onChange={(e) => update('projectName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 업무 내용 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">업무 내용</label>
        <textarea
          placeholder="이번 주 주요 업무를 간략히 적어주세요"
          value={formData.summary}
          onChange={(e) => update('summary', e.target.value)}
          rows={4}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* 진도율 슬라이더 */}
      <div>
        <ProgressSlider value={formData.progress} onChange={(v) => update('progress', v)} />
      </div>

      {/* 중요도 Segmented Control */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">중요도</label>
        <PrioritySelector
          value={formData.priority}
          onChange={(p: Priority) => update('priority', p)}
        />
      </div>

      {/* 이슈/특이사항 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          이슈 / 특이사항{' '}
          <span className="text-slate-400 font-normal">(선택)</span>
        </label>
        <textarea
          placeholder="공유할 이슈나 특이사항이 있다면 적어주세요"
          value={formData.issues ?? ''}
          onChange={(e) => update('issues', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Footer: 임시저장 표시 + 제출 버튼 */}
      <div className="flex items-center justify-between pt-1">
        <AnimatePresence>
          {lastSaved && (
            <motion.div
              key="save-indicator"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-xs text-slate-400"
            >
              <Save size={12} />
              임시 저장됨
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="ml-auto flex items-center gap-2 px-7 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
        >
          <Send size={15} />
          제출하기
        </button>
      </div>
    </form>
  );
}
