import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Hash, CalendarDays } from 'lucide-react';
import { useAuthStore, type LoginRegisterData } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

const DEFAULT_FORM: LoginRegisterData = {
  id: '',
  name: '',
  email: '',
  password: '',
  admin_yn: false,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const registerLoginUser = useAuthStore((s) => s.registerLoginUser);
  const [form, setForm] = useState<LoginRegisterData>(DEFAULT_FORM);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof LoginRegisterData>(key: K, value: LoginRegisterData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await registerLoginUser(form);
      toast.success('가입이 완료되었습니다!');
      navigate('/weekly-sync');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : '가입에 실패했습니다.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200 mb-2">
            <CalendarDays className="text-white" size={32} />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
            <UserPlus size={14} />
            회원가입
          </div>
          <h1 className="text-3xl font-black text-slate-900">가입하기</h1>
          <p className="text-slate-500 text-sm">계정 정보를 입력하여 가입하세요.</p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          {/* 오렌지 상단 accent */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />

          <form onSubmit={handleSubmit} className="space-y-5 p-8">
            {/* 아이디 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">아이디</label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={form.id}
                  onChange={(e) => update('id', e.target.value)}
                  placeholder="사용할 아이디를 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
              </div>
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
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
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
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="이메일 주소를 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
              </div>
            </div>

            {/* 패스워드 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">패스워드</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="비밀번호를 입력하세요 (4자 이상)"
                  required
                  minLength={4}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
              </div>
            </div>

            {/* 패스워드 확인 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                패스워드 확인
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && form.password !== confirmPassword
                      ? 'border-rose-300 focus:ring-rose-300'
                      : 'border-slate-200 focus:ring-orange-300 focus:border-orange-400'
                  }`}
                />
              </div>
              {confirmPassword && form.password !== confirmPassword && (
                <p className="mt-1.5 text-xs text-rose-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={loading || (!!confirmPassword && form.password !== confirmPassword)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="border-t border-slate-100 mx-8 pb-8 pt-5 text-center">
            <p className="text-sm text-slate-500">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
