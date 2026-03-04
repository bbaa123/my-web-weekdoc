import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardEdit, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReportFormData } from '../types';
import { ReportForm } from '../components/ReportForm';

export function MemberReportPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (data: ReportFormData) => {
    // In production: call createReport API
    console.log('Report submitted:', data);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={15} />
          홈으로
        </Link>

        {/* Page header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
            <ClipboardEdit size={16} />
            주간 보고서
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            이번 주 업무를 기록해 주세요
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            작성 내용은 자동으로 임시 저장됩니다.
          </p>
        </div>

        {/* Form / Success */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100 space-y-4"
            >
              <div className="text-5xl">🎉</div>
              <p className="text-lg font-bold text-slate-900">제출이 완료되었습니다!</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                수고하셨습니다. 좋은 주말 보내세요!
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all text-sm"
              >
                다시 작성하기
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <ReportForm onSubmit={handleSubmit} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
