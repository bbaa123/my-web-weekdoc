/**
 * MyPage - 사용자 본인 정보 관리 페이지 (탭 구조)
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Loader2,
  Save,
  ArrowLeft,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Phone,
  Tag,
  ImageIcon,
  FileText,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { toast } from '@/core/utils/toast';
import { getUserProfile, upsertUserProfile, changePassword } from '../api';
import { POSITION_OPTIONS } from '../types';
import type { UserProfile } from '../types';
import { DepartmentSelect } from '@/core/ui/DepartmentSelect';

const BRAND = '#FF6B00';

type Tab = 'profile' | 'password';

export function MyPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 내 정보 수정 폼 상태
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [adminYn, setAdminYn] = useState(false);
  const [tel, setTel] = useState('');
  const [job, setJob] = useState('');
  const [nicname, setNicname] = useState('');
  const [remark, setRemark] = useState('');
  const [picture, setPicture] = useState('');
  const [picturePreview, setPicturePreview] = useState('');

  // 비밀번호 변경 폼 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadProfile();
  }, [user]);

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
      setTel(data.tel ?? '');
      setJob(data.job ?? '');
      setNicname(data.nicname ?? '');
      setRemark(data.remark ?? '');
      setPicture(data.picture ?? '');
      setPicturePreview(data.picture ?? '');
    } catch {
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setDepartment(user.department ?? '');
        setPosition(user.position ?? '');
        setAdminYn(user.is_admin);
      }
      toast.error('프로필 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePictureChange = (value: string) => {
    setPicture(value);
    setPicturePreview(value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPicture(dataUrl);
      setPicturePreview(dataUrl);
    };
    reader.readAsDataURL(file);
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
        tel: tel.trim() || null,
        job: job.trim() || null,
        nicname: nicname.trim() || null,
        remark: remark.trim() || null,
        picture: picture.trim() || null,
      });
      setProfile(updated);

      // auth store 상태 업데이트 (헤더 실시간 반영)
      if (user) {
        setUser({
          ...user,
          name: updated.name,
          email: updated.email,
          nicname: updated.nicname ?? null,
          picture: updated.picture ?? null,
          department: updated.department ?? '',
          position: (updated.position as '매니저' | '팀장' | '센터장') ?? '매니저',
          is_admin: updated.admin_yn,
        });
      }

      toast.success('프로필이 저장되었습니다.');
      navigate('/weekly-sync');
    } catch {
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!newPassword) {
      toast.error('새 비밀번호를 입력해주세요.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch {
      toast.error('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  const userId = profile?.id ?? user.login_id ?? '';
  const isAdmin = adminYn;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: BRAND }}
            >
              <CalendarDays className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900">VNTG</span>
              <span className="ml-2 text-xs font-semibold" style={{ color: BRAND }}>
                My Page
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/weekly-sync')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={15} />
            대시보드로 돌아가기
          </button>
        </div>
      </header>

      {/* ── 메인 콘텐츠 ───────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">My Page</h1>
          <p className="text-sm text-slate-400 mt-1">내 정보를 조회하고 수정할 수 있습니다.</p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 상단 오렌지 배너 */}
          <div
            className="h-2"
            style={{ background: `linear-gradient(to right, ${BRAND}, #ff8c3a)` }}
          />

          {/* 프로필 헤더 */}
          <div className="px-8 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {/* 프로필 이미지 또는 아이콘 */}
              <div className="flex-shrink-0">
                {picturePreview ? (
                  <img
                    src={picturePreview}
                    alt="프로필"
                    className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-orange-100"
                    onError={() => setPicturePreview('')}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: '#fff3e8' }}
                  >
                    {isAdmin ? (
                      <ShieldCheck size={28} style={{ color: BRAND }} />
                    ) : (
                      <User size={28} style={{ color: BRAND }} />
                    )}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-400 font-mono">{userId || '-'}</span>
                  {isAdmin && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#fff3e8', color: BRAND }}
                    >
                      관리자
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'border-b-2 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              style={
                activeTab === 'profile'
                  ? { borderBottomColor: BRAND, color: BRAND, backgroundColor: '#fff8f4' }
                  : {}
              }
            >
              <User size={15} />
              내 정보 수정
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all duration-200 ${
                activeTab === 'password'
                  ? 'border-b-2 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              style={
                activeTab === 'password'
                  ? { borderBottomColor: BRAND, color: BRAND, backgroundColor: '#fff8f4' }
                  : {}
              }
            >
              <KeyRound size={15} />
              비밀번호 변경
            </button>
          </div>

          {/* ── 탭 콘텐츠 ── */}
          <div className="px-8 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin" style={{ color: BRAND }} />
              </div>
            ) : (
              <>
                {/* ──────────────── 내 정보 수정 탭 ──────────────── */}
                <div
                  className={`space-y-5 transition-all duration-200 ${
                    activeTab === 'profile' ? 'block' : 'hidden'
                  }`}
                >
                  {/* 프로필 저장 상태 뱃지 */}
                  {profile && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                        profile.exists_in_users
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      {profile.exists_in_users
                        ? '저장된 프로필이 있습니다.'
                        : '처음 등록하는 프로필입니다. 정보를 입력하고 저장해주세요.'}
                    </div>
                  )}

                  {/* ID (읽기 전용) */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <User size={12} />
                      ID
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono select-none">
                      {userId || '-'}
                    </div>
                  </div>

                  {/* 이름 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <User size={12} />
                      이름 <span style={{ color: BRAND }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 닉네임 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Tag size={12} />
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={nicname}
                      onChange={(e) => setNicname(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 이메일 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Mail size={12} />
                      이메일 <span style={{ color: BRAND }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 전화번호 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Phone size={12} />
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 부서 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Building2 size={12} />
                      부서
                    </label>
                    <DepartmentSelect
                      value={department}
                      onChange={setDepartment}
                      placeholder="부서를 선택하세요"
                      className="text-sm text-slate-800 rounded-xl py-3"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 직급 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <Briefcase size={12} />
                      직급
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
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

                  {/* 담당 업무 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <FileText size={12} />
                      담당 업무
                    </label>
                    <textarea
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      placeholder="담당 업무를 입력하세요"
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 자기소개 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <User size={12} />
                      자기소개
                    </label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="자기소개를 입력하세요"
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />
                  </div>

                  {/* 사진 */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <ImageIcon size={12} />
                      프로필 사진
                    </label>

                    {/* 미리보기 */}
                    {picturePreview && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <img
                          src={picturePreview}
                          alt="미리보기"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
                          onError={() => setPicturePreview('')}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-600">미리보기</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{picture}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPicture('');
                            setPicturePreview('');
                          }}
                          className="text-xs text-red-400 hover:text-red-600 font-semibold flex-shrink-0"
                        >
                          삭제
                        </button>
                      </div>
                    )}

                    {/* URL 입력 */}
                    <input
                      type="url"
                      value={picture}
                      onChange={(e) => handlePictureChange(e.target.value)}
                      placeholder="이미지 URL을 입력하세요"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                      style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                    />

                    {/* 파일 업로드 */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-orange-300 hover:text-orange-500 transition-all w-full justify-center"
                      >
                        <Upload size={15} />
                        파일에서 이미지 선택
                      </button>
                    </div>
                  </div>

                  {/* 관리자 여부 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <ShieldCheck size={12} />
                      관리자 여부
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setAdminYn((prev) => !prev)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={adminYn ? { backgroundColor: BRAND } : { backgroundColor: '#d1d5db' }}
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

                  {/* 저장 버튼 */}
                  <div className="pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
                      style={{ backgroundColor: BRAND }}
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? '저장 중...' : '변경사항 저장'}
                    </button>
                  </div>
                </div>

                {/* ──────────────── 비밀번호 변경 탭 ──────────────── */}
                <div
                  className={`space-y-5 transition-all duration-200 ${
                    activeTab === 'password' ? 'block' : 'hidden'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700"
                  >
                    <KeyRound size={15} />
                    보안을 위해 주기적으로 비밀번호를 변경해주세요.
                  </div>

                  {/* 현재 비밀번호 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <KeyRound size={12} />
                      현재 비밀번호 <span style={{ color: BRAND }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호를 입력하세요"
                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 새 비밀번호 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <KeyRound size={12} />
                      새 비밀번호 <span style={{ color: BRAND }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="새 비밀번호를 입력하세요 (최소 4자)"
                        className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                        style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 새 비밀번호 확인 */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <KeyRound size={12} />
                      새 비밀번호 확인 <span style={{ color: BRAND }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          confirmNewPassword && newPassword !== confirmNewPassword
                            ? 'border-red-300 focus:ring-red-300'
                            : confirmNewPassword && newPassword === confirmNewPassword
                              ? 'border-emerald-300 focus:ring-emerald-300'
                              : 'border-slate-200'
                        }`}
                        style={
                          !confirmNewPassword || newPassword === confirmNewPassword
                            ? ({ '--tw-ring-color': BRAND } as React.CSSProperties)
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmNewPassword && (
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          newPassword === confirmNewPassword ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {newPassword === confirmNewPassword
                          ? '✓ 비밀번호가 일치합니다.'
                          : '✗ 비밀번호가 일치하지 않습니다.'}
                      </p>
                    )}
                  </div>

                  {/* 비밀번호 변경 버튼 */}
                  <div className="pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        changingPassword ||
                        !currentPassword ||
                        !newPassword ||
                        newPassword !== confirmNewPassword
                      }
                      className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
                      style={{ backgroundColor: BRAND }}
                    >
                      {changingPassword ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <KeyRound size={16} />
                      )}
                      {changingPassword ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
