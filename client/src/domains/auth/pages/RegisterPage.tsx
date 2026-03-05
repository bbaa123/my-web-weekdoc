import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building2, Briefcase, Star, Shield } from 'lucide-react';
import { useAuthStore, type RegisterData } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';

const POSITIONS = ['매니저', '팀장', '센터장'] as const;
type Position = (typeof POSITIONS)[number];

const DEFAULT_FORM: RegisterData = {
  name: '',
  department: '',
  email: '',
  role: '',
  position: '매니저',
  is_admin: false,
  password: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState<RegisterData>(DEFAULT_FORM);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof RegisterData>(key: K, value: RegisterData[K]) => {
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
      await register(form);
      toast.success('가입이 완료되었습니다!');
      navigate('/report');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold">
            <UserPlus size={16} />
            가입 신청
          </div>
          <h1 className="text-3xl font-black text-slate-900">회원가입</h1>
          <p className="text-slate-500 text-sm">주간보고 시스템에 가입하세요.</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 인디고 상단 accent */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600" />
          <form onSubmit={handleSubmit} className="space-y-5 p-8">
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* 부서 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">부서</label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  placeholder="부서명을 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

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
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="이메일 주소를 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* 담당업무 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">담당업무</label>
              <div className="relative">
                <Briefcase
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  placeholder="담당하고 있는 업무를 입력하세요"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* 직책 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">직책</label>
              <div className="relative">
                <Star
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={form.position}
                  onChange={(e) => update('position', e.target.value as Position)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 관리자 유무 */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Shield size={18} className="text-slate-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">관리자</p>
                <p className="text-xs text-slate-400">관리자 권한을 부여합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_admin}
                  onChange={(e) => update('is_admin', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
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
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="비밀번호를 입력하세요 (4자 이상)"
                  required
                  minLength={4}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                비밀번호 확인
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
                      : 'border-slate-200 focus:ring-indigo-300 focus:border-indigo-400'
                  }`}
                />
              </div>
              {confirmPassword && form.password !== confirmPassword && (
                <p className="mt-1.5 text-xs text-rose-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (!!confirmPassword && form.password !== confirmPassword)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {loading ? '가입 중...' : '가입 신청'}
            </button>
          </form>

          <div className="border-t border-slate-100 mx-8 pb-8 pt-5 text-center">
            <p className="text-sm text-slate-500">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
