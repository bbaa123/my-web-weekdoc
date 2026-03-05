import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, ClipboardList, Shield } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminBypass) {
      setUser({
        id: 0,
        email: 'admin@local',
        name: '관리자',
        department: '관리팀',
        role: '시스템 관리자',
        position: '센터장',
        is_admin: true,
        is_active: true,
      });
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('로그인 성공!');
      navigate('/report');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
            <ClipboardList size={16} />
            주간보고 시스템
          </div>
          <h1 className="text-3xl font-black text-slate-900">로그인</h1>
          <p className="text-slate-500 text-sm">주간보고 시스템에 접속하려면 로그인하세요.</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 인디고 상단 accent */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600" />

          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  이메일 (아이디)
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소를 입력하세요"
                    required={!adminBypass}
                    disabled={adminBypass}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                    required={!adminBypass}
                    disabled={adminBypass}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* 관리자 모드 */}
              <div
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  adminBypass
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
                onClick={() => setAdminBypass(!adminBypass)}
              >
                <Shield
                  size={16}
                  className={`shrink-0 transition-colors ${adminBypass ? 'text-amber-600' : 'text-slate-400'}`}
                />
                <div className="flex-1">
                  <p className={`text-sm font-semibold transition-colors ${adminBypass ? 'text-amber-700' : 'text-slate-600'}`}>
                    관리자 모드
                  </p>
                  <p className={`text-xs transition-colors ${adminBypass ? 'text-amber-500' : 'text-slate-400'}`}>
                    체크 시 로그인 없이 대시보드 전체 화면으로 입장
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminBypass}
                  onChange={(e) => {
                    e.stopPropagation();
                    setAdminBypass(e.target.checked);
                  }}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                  adminBypass
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                <LogIn size={16} />
                {adminBypass ? '대시보드로 입장' : loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-slate-500">
                계정이 없으신가요?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  가입 신청
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
