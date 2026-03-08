import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, User, CalendarDays, UserPlus, Shield } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

export function LoginPage() {
  const navigate = useNavigate();
  const loginById = useAuthStore((s) => s.loginById);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginById(loginId, password);
      toast.success('로그인 성공!');
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : '로그인에 실패했습니다.';
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
            주간보고 시스템
          </div>
          <h1 className="text-3xl font-black text-slate-900">로그인</h1>
          <p className="text-slate-500 text-sm">아이디와 비밀번호를 입력하세요.</p>
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
                  아이디
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">비밀번호</label>
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* 관리자 체크박스 */}
              <label
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all select-none ${
                  isAdmin
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                    isAdmin
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {isAdmin && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Shield size={15} className={isAdmin ? 'text-amber-500' : 'text-slate-400'} />
                <span className="text-sm font-semibold">
                  관리자로 로그인 (전체 대시보드 보기)
                </span>
              </label>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                  isAdmin
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                }`}
              >
                <LogIn size={16} />
                {loading ? '로그인 중...' : isAdmin ? '관리자 로그인' : '로그인'}
              </button>
            </form>

            {/* 회원가입 안내 */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500 text-center mb-3">
                아이디가 없으신가요?
              </p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-50 text-orange-600 font-bold rounded-xl border border-orange-200 hover:bg-orange-100 active:scale-95 transition-all"
              >
                <UserPlus size={16} />
                가입하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
