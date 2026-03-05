import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardEdit, BarChart2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReportFormData } from '../types';
import { ReportForm } from '../components/ReportForm';
import { useAuthStore } from '@/core/store/useAuthStore';
import { apiClient } from '@/core/api/client';
import { toast } from '@/core/utils/toast';

export function MemberReportPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (data: ReportFormData) => {
    try {
      await apiClient.post("/v1/weekly-reports", {
        work_type: data.workType,
        project_name: data.projectName,
        summary: data.summary,
        progress: data.progress,
        priority: data.priority,
        issues: data.issues,
      });
      setSubmitted(true);
    } catch {
      toast.error("보고서 제출에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        {/* 상단: 대시보드 버튼 + 로그아웃 */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group"
            title="전체 보고서 현황 보기"
          >
            <BarChart2 size={16} className="group-hover:text-indigo-600 transition-colors" />
            전체 현황 보기
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{user.name}</span> 님
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </div>

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
              <div className="flex gap-3 justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-all text-sm"
                >
                  다시 작성하기
                </button>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all text-sm"
                >
                  <BarChart2 size={14} />
                  현황 보기
                </Link>
              </div>
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
