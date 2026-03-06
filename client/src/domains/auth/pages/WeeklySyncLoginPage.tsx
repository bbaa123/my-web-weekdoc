import { useState } from 'react';
import { CalendarDays, Hash, User, Mail, Lock, Shield, LogIn } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

export function WeeklySyncLoginPage() {
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminYn, setAdminYn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminYn) {
      setUser({
        id: 0,
        email: email || 'admin@local',
        name: name || '관리자',
        department: '관리팀',
        role: '시스템 관리자',
        position: '센터장',
        is_admin: true,
        is_active: true,
      });
      toast.success('관리자로 입장합니다.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('로그인 성공!');
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
              {/* ID (자동 생성 표시) */}
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
                    placeholder="자동 생성 (DB 기본키)"
                    disabled
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 placeholder:text-slate-300 cursor-not-allowed text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">* 로그인 후 자동으로 부여됩니다.</p>
              </div>

              {/* 이름 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">이름</label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">이메일</label>
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
                    required={!adminYn}
                    disabled={adminYn}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                    required={!adminYn}
                    disabled={adminYn}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* 관리자 유무 (admin_yn) */}
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  adminYn
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-slate-50 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
                onClick={() => setAdminYn(!adminYn)}
              >
                <Shield
                  size={18}
                  className={`shrink-0 transition-colors ${adminYn ? 'text-orange-500' : 'text-slate-400'}`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold transition-colors ${adminYn ? 'text-orange-700' : 'text-slate-600'}`}
                  >
                    관리자 여부 (admin_yn)
                  </p>
                  <p
                    className={`text-xs transition-colors ${adminYn ? 'text-orange-500' : 'text-slate-400'}`}
                  >
                    체크 시 관리자 권한으로 입장합니다.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminYn}
                    onChange={(e) => {
                      e.stopPropagation();
                      setAdminYn(e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      adminYn
                        ? 'bg-orange-500 after:translate-x-full after:border-white'
                        : 'bg-slate-200'
                    }`}
                  />
                </label>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                  adminYn
                    ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                }`}
              >
                <LogIn size={16} />
                {adminYn ? '관리자로 입장' : loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-xs text-slate-400">
          계정 문의는 시스템 관리자에게 연락하세요.
        </p>
      </div>
    </div>
  );
}
