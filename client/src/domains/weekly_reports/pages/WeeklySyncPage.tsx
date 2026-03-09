import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Shield,
  User,
  Loader2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { fetchWeeklyReports } from '../api';
import type { WeeklyReport } from '../types';

const STATUS_COLOR: Record<string, string> = {
  완료: 'bg-emerald-100 text-emerald-700',
  진행중: 'bg-blue-100 text-blue-700',
  지연: 'bg-rose-100 text-rose-700',
  대기: 'bg-slate-100 text-slate-600',
};

const PRIORITY_COLOR: Record<string, string> = {
  높음: 'bg-rose-50 text-rose-600 border border-rose-200',
  중간: 'bg-amber-50 text-amber-600 border border-amber-200',
  낮음: 'bg-slate-50 text-slate-500 border border-slate-200',
};

export function WeeklySyncPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadReports();
  }, [user]);

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

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const isAdmin = user.is_admin;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900">Weekly Sync</span>
              <span className="ml-2 text-xs font-semibold text-orange-500">주간보고</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 사용자 정보 */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
              {isAdmin ? (
                <Shield size={14} className="text-orange-500" />
              ) : (
                <User size={14} className="text-slate-500" />
              )}
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
              {isAdmin && (
                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full">
                  관리자
                </span>
              )}
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 상단 타이틀 */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            {isAdmin ? '전체 주간보고 현황' : '내 주간보고'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? '모든 팀원의 주간보고를 확인합니다.'
              : '본인이 등록한 주간보고를 확인합니다.'}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="animate-spin text-orange-400" size={32} />
            <p className="text-sm text-slate-400">불러오는 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <FileText size={40} className="text-slate-300" />
            <p className="text-slate-400 font-medium">등록된 주간보고가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((r) => (
              <button
                key={r.weekly_reports_no}
                onClick={() => setSelected(r)}
                className="text-left w-full bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-orange-500 mb-1">
                      {r.year}년 {r.month}월 {r.week_number}
                    </p>
                    <p className="font-bold text-slate-900 text-base leading-tight">
                      {r.project_name || '(프로젝트명 없음)'}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <User size={11} />
                        {r.id}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-orange-400 transition-colors shrink-0 mt-0.5"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {r.status && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {r.status}
                    </span>
                  )}
                  {r.priority && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[r.priority] ?? 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                    >
                      우선순위: {r.priority}
                    </span>
                  )}
                  {r.company && (
                    <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                      {r.company}
                    </span>
                  )}
                </div>

                {/* 진행률 바 */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>진행률</span>
                    <span className="font-semibold text-orange-500">{r.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${r.progress}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-orange-500 mb-1">
                    {selected.year}년 {selected.month}월 {selected.week_number}
                  </p>
                  <h3 className="text-xl font-black text-slate-900">
                    {selected.project_name || '(프로젝트명 없음)'}
                  </h3>
                  {isAdmin && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <User size={11} />
                      작성자: {selected.id}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-300 hover:text-slate-600 transition-colors text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {selected.company && (
                  <Row label="거래처" value={selected.company} />
                )}
                {selected.work_type && (
                  <Row label="업무유형" value={selected.work_type} />
                )}
                {selected.this_week && (
                  <Row label="이번 주 업무" value={selected.this_week} multiline />
                )}
                {selected.next_week && (
                  <Row label="다음 주 계획" value={selected.next_week} multiline />
                )}
                {selected.issues && (
                  <Row label="이슈/위험" value={selected.issues} multiline />
                )}
                {selected.feedback && (
                  <Row label="피드백" value={selected.feedback} multiline />
                )}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">진행률</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${selected.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-orange-500 w-8 text-right">
                        {selected.progress}%
                      </span>
                    </div>
                  </div>
                </div>
                {selected.submitted_at && (
                  <Row
                    label="제출일시"
                    value={new Date(selected.submitted_at).toLocaleString('ko-KR')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
      <p
        className={`text-slate-700 ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
