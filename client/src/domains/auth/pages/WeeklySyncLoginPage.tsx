import { useState } from 'react';
import { CalendarDays, Hash, User, Lock, LogIn, Shield } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

export function WeeklySyncLoginPage() {
  const loginById = useAuthStore((s) => s.loginById);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginId.trim()) {
      toast.error('아이디를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      await loginById(loginId.trim(), password);
      toast.success('로그인 성공!');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : '아이디 또는 비밀번호가 올바르지 않습니다.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200 mb-2">
            <CalendarDays className="text-white" size={32} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
            <CalendarDays size={14} />
            Weekly Sync
          </div>
          <h1 className="text-3xl font-black text-slate-900">로그인</h1>
          <p className="text-slate-500 text-sm">Weekly Sync에 접속하려면 로그인하세요.</p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          {/* 오렌지 상단 accent */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />

          <div className="p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 아이디 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  아이디 (ID)
                </label>
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* 패스워드 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  패스워드
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* admin_yn 안내 */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <Shield size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  관리자 계정(<code className="text-orange-600 font-semibold">admin_yn = true</code>)으로
                  로그인 시 모든 팀원의 Weekly Sync 전체 내용을 확인할 수 있습니다.
                </p>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogIn size={16} />
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400">
            계정 문의는 시스템 관리자에게 연락하세요.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <User size={11} />
            <span>login 테이블 기반 인증</span>
          </div>
        </div>
      </div>
    </div>
  );
}
