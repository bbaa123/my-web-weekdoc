/**
 * UserManagementPanel - 사용자 정보 조회/수정 슬라이드 패널
 */

import { useEffect, useState } from 'react';
import { X, User, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { getUserProfile, upsertUserProfile } from '../api';
import { POSITION_OPTIONS } from '../types';
import type { UserProfile } from '../types';
import { DepartmentSelect } from '@/core/ui/DepartmentSelect';

const BRAND = '#FF6B00';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserManagementPanel({ isOpen, onClose }: UserManagementPanelProps) {
  const authUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 폼 상태
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [adminYn, setAdminYn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
      setDepartment(data.department ?? '');
      setPosition(data.position ?? '');
      setAdminYn(data.admin_yn);
    } catch {
      // users 테이블 조회 실패 시 auth store의 기본 정보로 채움
      if (authUser) {
        setName(authUser.name);
        setEmail(authUser.email);
        setDepartment('');
        setPosition('');
        setAdminYn(authUser.is_admin);
      }
      toast.error('프로필 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (!email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const updated = await upsertUserProfile({
        name: name.trim(),
        email: email.trim(),
        department: department || null,
        position: position || null,
        admin_yn: adminYn,
      });
      setProfile(updated);
      toast.success('프로필이 저장되었습니다.');
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const userId = profile?.id ?? authUser?.login_id ?? '';

  return (
    <>
      {/* 백드롭 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* 슬라이드 패널 */}
      <div
        className={`fixed top-0 left-0 h-full w-80 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 패널 상단 오렌지 바 */}
        <div
          className="h-1.5 shrink-0"
          style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
        />

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#fff3e8' }}
            >
              <User size={16} style={{ color: BRAND }} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">사용자 관리</h2>
              <p className="text-[11px] text-slate-400">프로필 정보 조회 및 수정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: BRAND }} />
            </div>
          ) : (
            <>
              {/* users 테이블 존재 여부 표시 */}
              {profile && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                    profile.exists_in_users
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {profile.exists_in_users
                    ? '저장된 프로필이 있습니다.'
                    : '처음 등록하는 프로필입니다.'}
                </div>
              )}

              {/* ID (읽기 전용) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  ID
                </label>
                <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono select-none">
                  {userId || '-'}
                </div>
              </div>

              {/* 이름 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  이름 <span style={{ color: BRAND }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                />
              </div>

              {/* 이메일 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  이메일 <span style={{ color: BRAND }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                />
              </div>

              {/* 부서 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  부서
                </label>
                <DepartmentSelect
                  value={department}
                  onChange={setDepartment}
                  placeholder="부서를 선택하세요"
                  className="text-sm text-slate-800 rounded-lg"
                  style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                />
              </div>

              {/* 직급 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  직급
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                >
                  <option value="">직급을 선택하세요</option>
                  {POSITION_OPTIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* 관리자 여부 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  관리자 여부
                </label>
                <div className="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setAdminYn((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      adminYn ? 'bg-orange-500' : 'bg-slate-300'
                    }`}
                    style={adminYn ? { backgroundColor: BRAND } : {}}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        adminYn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">
                    {adminYn ? '관리자' : '일반 사용자'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 하단 저장 버튼 */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
            style={{ backgroundColor: BRAND }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? '저장 중...' : '정보 저장하기'}
          </button>
        </div>
      </div>
    </>
  );
}
