/**
 * PresencePage
 * 접속 현황 전용 페이지
 */

import { useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { TeamPresenceWidget } from '../components/TeamPresenceWidget';

const BRAND = '#FF6B00';

export function PresencePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* 로고 */}
          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND }}>
              <span className="text-white text-xs font-black">W</span>
            </div>
            <span className="ml-1 text-xs font-semibold" style={{ color: BRAND }}>주간보고</span>
          </button>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
            <button onClick={() => navigate('/weekly-sync')} className="hover:text-slate-700 cursor-pointer">
              Dashboard
            </button>
            <button onClick={() => navigate('/reports')} className="hover:text-slate-700 cursor-pointer">
              Reports
            </button>
            <button onClick={() => navigate('/org-chart')} className="hover:text-slate-700 cursor-pointer">
              Teams
            </button>
            <button onClick={() => navigate('/department-manage')} className="hover:text-slate-700 cursor-pointer">
              Departments
            </button>
            <button onClick={() => navigate('/user-manage')} className="hover:text-slate-700 cursor-pointer">
              Users
            </button>
            <span className="text-slate-900 border-b-2 pb-0.5" style={{ borderColor: BRAND }}>
              Presence
            </span>
          </nav>

          {/* 사용자 + 로그아웃 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/my-page')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold">
                {(user?.nicname || user?.name || '?')[0]}
              </div>
              <span className="text-xs font-semibold text-orange-700 max-w-[80px] truncate">
                {user?.nicname || user?.name}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${BRAND}15` }}>
            <Activity size={20} style={{ color: BRAND }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">접속 현황</h1>
            <p className="text-sm text-slate-400">로그인/로그아웃 기록 기반 · 60초마다 자동 갱신</p>
          </div>
        </div>

        <div className="max-w-xl">
          <TeamPresenceWidget />
        </div>
      </main>
    </div>
  );
}
