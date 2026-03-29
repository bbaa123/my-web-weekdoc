import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Pencil, Trash2, LogOut, User, X, Check } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api';
import type { Department, DepartmentCreate, DepartmentUpdate } from '../types';

// ─── 상수 ──────────────────────────────────────────────────────────────────
const BRAND = '#FF6B00';

interface FormState {
  dept_code: string;
  dept_name: string;
  parent_dept_code: string;
  use_yn: 'Y' | 'N';
  dept_level: string;
  sort_order: string;
}

const makeEmptyForm = (): FormState => ({
  dept_code: '',
  dept_name: '',
  parent_dept_code: '',
  use_yn: 'Y',
  dept_level: '1',
  sort_order: '0',
});

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────

export function DepartmentManagePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [form, setForm] = useState<FormState>(makeEmptyForm());
  const [saving, setSaving] = useState(false);

  // 삭제 확인 상태
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  // ─── 데이터 로드 ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepts(data);
    } catch {
      toast.error('부서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // admin이 아니면 접근 차단
    if (user && !user.is_admin) {
      toast.error('관리자만 접근할 수 있습니다.');
      navigate('/weekly-sync');
      return;
    }
    load();
  }, [load, user, navigate]);

  // ─── 모달 열기 ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(makeEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditTarget(dept);
    setForm({
      dept_code: dept.dept_code,
      dept_name: dept.dept_name,
      parent_dept_code: dept.parent_dept_code ?? '',
      use_yn: dept.use_yn,
      dept_level: dept.dept_level != null ? String(dept.dept_level) : '1',
      sort_order: String(dept.sort_order),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(makeEmptyForm());
  };

  // ─── 저장 ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.dept_code.trim() || !form.dept_name.trim()) {
      toast.error('부서코드와 부서명은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const payload: DepartmentUpdate = {
          dept_name: form.dept_name,
          parent_dept_code: form.parent_dept_code || null,
          use_yn: form.use_yn,
          dept_level: form.dept_level ? Number(form.dept_level) : null,
          sort_order: Number(form.sort_order),
        };
        await updateDepartment(editTarget.dept_code, payload);
        toast.success('부서 정보가 수정되었습니다.');
      } else {
        const payload: DepartmentCreate = {
          dept_code: form.dept_code,
          dept_name: form.dept_name,
          parent_dept_code: form.parent_dept_code || null,
          use_yn: form.use_yn,
          dept_level: form.dept_level ? Number(form.dept_level) : null,
          sort_order: Number(form.sort_order),
        };
        await createDepartment(payload);
        toast.success('부서가 등록되었습니다.');
      }
      closeModal();
      load();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ─── 삭제 ────────────────────────────────────────────────────────────────
  const handleDelete = async (dept: Department) => {
    try {
      await deleteDepartment(dept.dept_code);
      toast.success(`${dept.dept_name} 부서가 삭제되었습니다.`);
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  // ─── 로그아웃 ────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // parent_dept_code 드롭다운 옵션 (수정 시 자기 자신 제외)
  const parentOptions = depts.filter(
    (d) => !editTarget || d.dept_code !== editTarget.dept_code,
  );

  // ─── 렌더 ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← 대시보드
          </button>
          <div className="flex items-center gap-2">
            <Building2 size={20} style={{ color: BRAND }} />
            <h1 className="text-lg font-bold text-gray-800">부서 관리</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Teams 링크 */}
          <button
            onClick={() => navigate('/org-chart')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 size={14} />
            Teams
          </button>

          {/* 사용자 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <User size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
          </div>

          {/* 로그아웃 */}
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
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">부서 목록</h2>
            <p className="text-sm text-gray-500 mt-0.5">총 {depts.length}개 부서</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            <Plus size={16} />
            부서 추가
          </button>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">로딩 중...</div>
          ) : depts.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">등록된 부서가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">부서코드</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">부서명</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">상위부서</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">레벨</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">정렬순서</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">사용여부</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {depts.map((dept) => (
                  <tr key={dept.dept_code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-800 font-medium">
                      {dept.dept_code}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{dept.dept_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {dept.parent_dept_code ? (
                        <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium border border-orange-100">
                          {dept.parent_dept_code}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {dept.dept_level != null ? (
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                          Lv.{dept.dept_level}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{dept.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      {dept.use_yn === 'Y' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-100">
                          <Check size={10} />
                          사용
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs font-medium border border-gray-200">
                          <X size={10} />
                          미사용
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(dept)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="수정"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(dept)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ─── 등록/수정 모달 ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editTarget ? '부서 수정' : '부서 등록'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="px-6 py-5 space-y-4">
              {/* 부서코드 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  부서코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.dept_code}
                  onChange={(e) => setForm((f) => ({ ...f, dept_code: e.target.value }))}
                  disabled={!!editTarget}
                  placeholder="예: DEPT001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-400"
                />
                {editTarget && (
                  <p className="text-xs text-gray-400 mt-1">부서코드는 수정할 수 없습니다.</p>
                )}
              </div>

              {/* 부서명 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  부서명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.dept_name}
                  onChange={(e) => setForm((f) => ({ ...f, dept_name: e.target.value }))}
                  placeholder="예: 개발팀"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* 상위부서 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  상위부서
                </label>
                <select
                  value={form.parent_dept_code}
                  onChange={(e) => setForm((f) => ({ ...f, parent_dept_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">없음 (최상위 부서)</option>
                  {parentOptions.map((d) => (
                    <option key={d.dept_code} value={d.dept_code}>
                      {d.dept_code} — {d.dept_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 레벨 + 정렬순서 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    부서 레벨
                  </label>
                  <select
                    value={form.dept_level}
                    onChange={(e) => setForm((f) => ({ ...f, dept_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="1">1 (최상위)</option>
                    <option value="2">2 (중간)</option>
                    <option value="3">3 (하위)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    정렬순서
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* 사용여부 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  사용여부
                </label>
                <div className="flex gap-4">
                  {(['Y', 'N'] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="use_yn"
                        value={val}
                        checked={form.use_yn === val}
                        onChange={() => setForm((f) => ({ ...f, use_yn: val }))}
                        className="accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">{val === 'Y' ? '사용' : '미사용'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm text-white rounded-lg font-semibold transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? '저장 중...' : editTarget ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 삭제 확인 모달 ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">부서 삭제</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                <strong className="text-gray-800">{deleteTarget.dept_name}</strong> 부서를
                삭제하시겠습니까?
                <br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 pb-5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
