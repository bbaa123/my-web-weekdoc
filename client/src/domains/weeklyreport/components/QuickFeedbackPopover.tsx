import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, MessageSquare, X } from 'lucide-react';
import type { WeeklyReport } from '../types';

interface QuickFeedbackPopoverProps {
  report: WeeklyReport | null;
  onClose: () => void;
  onSubmit: (reportId: string, comment?: string) => void;
}

export function QuickFeedbackPopover({
  report,
  onClose,
  onSubmit,
}: QuickFeedbackPopoverProps) {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (report) {
      setComment('');
      const timer = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [report]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCheck = () => {
    if (!report) return;
    onSubmit(report.id, undefined);
    onClose();
  };

  const handleComment = () => {
    if (!report || !comment.trim()) return;
    onSubmit(report.id, comment.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {report && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Popover panel */}
          <motion.div
            key="popover"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-x-4 bottom-6 md:inset-auto md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full md:w-96 space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{report.authorName}님의 보고서</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {report.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>

            {/* Check button */}
            <button
              type="button"
              onClick={handleCheck}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all"
            >
              <CheckCircle size={18} />
              확인 완료
            </button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-slate-100" />
              <span className="px-3 bg-white text-xs text-slate-400">또는 피드백 남기기</span>
              <div className="flex-1 border-t border-slate-100" />
            </div>

            {/* Comment input */}
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="짧은 피드백을 남겨주세요"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment();
                }}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={!comment.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                <MessageSquare size={15} />
                피드백 전송
                <span className="text-indigo-300 text-xs font-normal ml-1">⌘ Enter</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
