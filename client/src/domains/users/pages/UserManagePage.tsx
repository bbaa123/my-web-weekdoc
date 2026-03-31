import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Pencil, LogOut, User, X, Check, Shield, ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { DepartmentSelect } from '@/core/ui/DepartmentSelect';
import { fetchAllUsers, adminUpdateUser } from '../api';
import { POSITION_OPTIONS } from '../types';
import type { UserProfile, UserUpsertRequest } from '../types';

const BRAND = '#FF6B00';

interface FormState {
  name: string;
  email: string;
  department: string;
  position: string;
  admin_yn: boolean;
  tel: string;
  job: string;
  nicname: string;
  remark: string;
}

const makeForm = (u: UserProfile): FormState => ({
  name: u.name,
  email: u.email,
  department: u.department ?? '',
  position: u.position ?? '',
  admin_yn: u.admin_yn,
  tel: u.tel ?? '',
  job: u.job ?? '',
  nicname: u.nicname ?? '',
  remark: u.remark ?? '',
});

export function UserManagePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.is_admin ?? false;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // 수정 모달
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch {
      toast.error('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (u: UserProfile) => {
    setEditTarget(u);
    setForm(makeForm(u));
  };

  const closeModal = () => {
    setEditTarget(null);
    setForm(null);
  };

  const handleSave = async () => {
    if (!editTarget || !form) return;
    if (!form.name.trim()) { toast.error('이름을 입력하세요.'); return; }
    if (!form.email.trim()) { toast.error('이메일을 입력하세요.'); return; }
    setSaving(true);
    try {
      const payload: UserUpsertRequest = {
        name: form.name,
        email: form.email,
        department: form.department || null,
        position: form.position || null,
        admin_yn: form.admin_yn,
        tel: form.tel || null,
        job: form.job || null,
        nicname: form.nicname || null,
        remark: form.remark || null,
        picture: editTarget.picture,
      };
      await adminUpdateUser(editTarget.id, payload);
      toast.success('사용자 정보가 수정되었습니다.');
      closeModal();
      load();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/weekly-sync')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 대시보드
          </button>
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: BRAND }} />
            <h1 className="text-lg font-bold text-gray-800">Users</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <User size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">사용자 목록</h2>
            <p className="text-sm text-gray-500 mt-0.5">총 {users.length}명</p>
          </div>
          {!isAdmin && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              조회 전용
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">로딩 중...</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">등록된 사용자가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">이름</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">이메일</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">부서</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">직급</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">관리자</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">프로필</th>
                  {isAdmin && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">관리</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-700 text-xs">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.department ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{u.position ?? <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3 text-center">
                      {u.admin_yn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium border border-orange-100">
                          <Shield size={10} />
                          관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs font-medium border border-gray-200">
                          <ShieldOff size={10} />
                          일반
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.exists_in_users ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-100">
                          <Check size={10} />
                          등록
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs font-medium border border-gray-200">
                          미등록
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ─── 수정 모달 ──────────────────────────────────────────────────────── */}
      {editTarget && form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">사용자 수정</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{editTarget.id}</p>
              </div>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* 이름 / 이메일 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => f && { ...f, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* 부서 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">부서</label>
                <DepartmentSelect
                  value={form.department}
                  onChange={(val) => setForm((f) => f && { ...f, department: val })}
                  placeholder="부서를 선택하세요"
                  className="text-sm rounded-lg"
                />
              </div>

              {/* 직급 / 연락처 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">직급</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm((f) => f && { ...f, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">선택</option>
                    {POSITION_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">연락처</label>
                  <input
                    type="text"
                    value={form.tel}
                    onChange={(e) => setForm((f) => f && { ...f, tel: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* 닉네임 / 담당업무 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">닉네임</label>
                  <input
                    type="text"
                    value={form.nicname}
                    onChange={(e) => setForm((f) => f && { ...f, nicname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">담당업무</label>
                  <input
                    type="text"
                    value={form.job}
                    onChange={(e) => setForm((f) => f && { ...f, job: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* 자기소개 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">자기소개</label>
                <textarea
                  value={form.remark}
                  onChange={(e) => setForm((f) => f && { ...f, remark: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              {/* 관리자 여부 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">관리자 여부</label>
                <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setForm((f) => f && { ...f, admin_yn: !f.admin_yn })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none`}
                    style={{ backgroundColor: form.admin_yn ? BRAND : '#d1d5db' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        form.admin_yn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    {form.admin_yn ? '관리자' : '일반 사용자'}
                  </span>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60 transition-colors"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
