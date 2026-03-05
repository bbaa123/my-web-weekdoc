import { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Flag,
  Settings,
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Save,
  Trash2,
  Megaphone,
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type SyncStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DELAYED';
type SyncPriority = '상' | '중' | '하';
type Company = '세아특수강' | '세아M&S' | '세아홀딩스' | '세아베스틸 지주';
type TaskType = '인사' | '영업' | '회계' | '구매' | '원가';

interface SyncEntry {
  id: string;
  authorName: string;
  avatarBg: string;
  company: string;
  companyColor: string;
  category: string;
  thisWeek: string;
  nextWeek: string;
  progress: number;
  priority: SyncPriority;
  status: SyncStatus;
  hasIssue: boolean;
  issueText?: string;
}

interface UserProfile {
  name: string;
  email: string;
  jobTitle: string;
  joinDate: string;
}

interface NoticeItem {
  id: string;
  content: string;
  createdAt: string;
}

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const COMPANY_OPTIONS: Company[] = ['세아특수강', '세아M&S', '세아홀딩스', '세아베스틸 지주'];
const TASK_TYPE_OPTIONS: TaskType[] = ['인사', '영업', '회계', '구매', '원가'];

const COMPANY_COLORS: Record<string, string> = {
  '세아특수강': 'bg-blue-100 text-blue-700',
  '세아M&S': 'bg-green-100 text-green-700',
  '세아홀딩스': 'bg-violet-100 text-violet-700',
  '세아베스틸 지주': 'bg-amber-100 text-amber-700',
};

const AVATAR_BG_POOL = [
  'bg-orange-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500',
  'bg-teal-500', 'bg-indigo-500',
];

// ────────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────────

const INITIAL_SYNC_DATA: SyncEntry[] = [
  {
    id: '1',
    authorName: '김민준',
    avatarBg: 'bg-orange-500',
    company: '세아특수강',
    companyColor: 'bg-blue-100 text-blue-700',
    category: '제품개발',
    thisWeek: '고객 포털 로그인/회원가입 UI 재설계 및 OAuth API 연동 완료. 디자인 시스템 토큰 적용.',
    nextWeek: 'QA 진행 및 퍼포먼스 최적화. 외부 OAuth 서버 캐싱 방안 검토.',
    progress: 85,
    priority: '상',
    status: 'IN_PROGRESS',
    hasIssue: true,
    issueText: '외부 OAuth 서버 응답 속도 이슈 — 임시 캐싱 대응 중',
  },
  {
    id: '2',
    authorName: '이서연',
    avatarBg: 'bg-violet-500',
    company: '세아M&S',
    companyColor: 'bg-green-100 text-green-700',
    category: '온보딩',
    thisWeek: '주간 정기 회의 참석 및 팀 온보딩 자료 전면 업데이트. 신규 입사자 교육 지원 3명.',
    nextWeek: '온보딩 자료 v2 배포 및 피드백 수집. 교육 효과 측정 지표 설계.',
    progress: 100,
    priority: '하',
    status: 'COMPLETED',
    hasIssue: false,
  },
  {
    id: '3',
    authorName: '박지호',
    avatarBg: 'bg-emerald-500',
    company: '세아홀딩스',
    companyColor: 'bg-violet-100 text-violet-700',
    category: '데이터',
    thisWeek: 'ETL 파이프라인 설계 착수. 데이터 소스 정의 및 스키마 초안 작성.',
    nextWeek: '데이터 소스 연결 PoC 및 변환 로직 초안 구현. 이해관계자 리뷰 진행.',
    progress: 25,
    priority: '중',
    status: 'PENDING',
    hasIssue: false,
  },
  {
    id: '4',
    authorName: '최수아',
    avatarBg: 'bg-rose-500',
    company: '세아베스틸 지주',
    companyColor: 'bg-amber-100 text-amber-700',
    category: '고객지원',
    thisWeek: '고객사 기술 지원 미팅 3건 처리. 긴급 버그 패치 배포 완료. 이슈 트래커 정리.',
    nextWeek: '고객사 A 배포 환경 재검토 및 안정화 작업. 다음 스프린트 계획 수립.',
    progress: 70,
    priority: '상',
    status: 'IN_PROGRESS',
    hasIssue: true,
    issueText: '고객사 A 배포 환경이 예상과 달라 추가 검토 필요',
  },
  {
    id: '5',
    authorName: '정우진',
    avatarBg: 'bg-cyan-500',
    company: '세아특수강',
    companyColor: 'bg-blue-100 text-blue-700',
    category: '개발지원',
    thisWeek: '코드 리뷰 10건 완료. 팀 내 Tailwind 4 마이그레이션 가이드 문서화.',
    nextWeek: 'Tailwind 4 마이그레이션 파일럿 적용. 컴포넌트 라이브러리 업데이트.',
    progress: 90,
    priority: '중',
    status: 'COMPLETED',
    hasIssue: false,
  },
  {
    id: '6',
    authorName: '한나래',
    avatarBg: 'bg-purple-500',
    company: '세아홀딩스',
    companyColor: 'bg-violet-100 text-violet-700',
    category: 'AI/ML',
    thisWeek: 'ML 모델 파인튜닝 및 A/B 테스트 설계 완료. 정확도 지표 수집 파이프라인 구축.',
    nextWeek: 'A/B 테스트 런칭 및 초기 결과 분석. 모델 성능 대시보드 프로토타입.',
    progress: 55,
    priority: '중',
    status: 'IN_PROGRESS',
    hasIssue: false,
  },
  {
    id: '7',
    authorName: '오승현',
    avatarBg: 'bg-amber-500',
    company: '세아M&S',
    companyColor: 'bg-green-100 text-green-700',
    category: '인프라',
    thisWeek: '모니터링 대시보드 개선 및 알림 규칙 재설정. Grafana 패널 8개 신규 추가.',
    nextWeek: 'Kubernetes 클러스터 업그레이드 계획 수립. 비용 최적화 검토.',
    progress: 60,
    priority: '중',
    status: 'COMPLETED',
    hasIssue: false,
  },
  {
    id: '8',
    authorName: '윤지민',
    avatarBg: 'bg-pink-500',
    company: '세아베스틸 지주',
    companyColor: 'bg-amber-100 text-amber-700',
    category: '기획',
    thisWeek: '사내 해커톤 기획 및 준비 완료. 참가팀 12팀 모집 완료. 심사위원 섭외.',
    nextWeek: '해커톤 운영 및 결과 발표. 우수 아이디어 사업화 검토 보고서 작성.',
    progress: 40,
    priority: '하',
    status: 'PENDING',
    hasIssue: false,
  },
  {
    id: '9',
    authorName: '강도현',
    avatarBg: 'bg-teal-500',
    company: '세아홀딩스',
    companyColor: 'bg-violet-100 text-violet-700',
    category: '보안',
    thisWeek: '취약점 점검 보고서 작성. 인증 모듈 보안 감사 착수.',
    nextWeek: '보안 패치 배포 및 침투 테스트 1차 결과 리뷰.',
    progress: 30,
    priority: '상',
    status: 'DELAYED',
    hasIssue: true,
    issueText: '외부 보안 감사 업체 일정 지연으로 마일스톤 재조정 필요',
  },
  {
    id: '10',
    authorName: '임소희',
    avatarBg: 'bg-indigo-500',
    company: '세아특수강',
    companyColor: 'bg-blue-100 text-blue-700',
    category: '마케팅',
    thisWeek: 'Q2 캠페인 전략 수립 및 크리에이티브 방향성 정의. 광고 소재 3종 제작.',
    nextWeek: 'SNS 채널 캠페인 론칭. 초기 성과 지표 모니터링 체계 구축.',
    progress: 75,
    priority: '중',
    status: 'IN_PROGRESS',
    hasIssue: false,
  },
];

// ────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────

function Avatar({ name, bgClass }: { name: string; bgClass: string }) {
  const initials = name.slice(0, 1);
  return (
    <div
      className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center text-white text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: SyncStatus }) {
  const configs: Record<SyncStatus, { label: string; className: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: 'COMPLETED',
      className: 'bg-slate-900 text-white',
      icon: <CheckCircle2 size={11} />,
    },
    IN_PROGRESS: {
      label: 'IN PROGRESS',
      className: 'bg-blue-100 text-blue-700',
      icon: <Clock size={11} />,
    },
    PENDING: {
      label: 'PENDING',
      className: 'bg-amber-100 text-amber-700',
      icon: <Clock size={11} />,
    },
    DELAYED: {
      label: 'DELAYED',
      className: 'bg-red-100 text-red-700',
      icon: <AlertCircle size={11} />,
    },
  };
  const { label, className, icon } = configs[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: SyncPriority }) {
  const configs: Record<SyncPriority, { label: string; dot: string; text: string }> = {
    상: { label: 'HIGH', dot: 'bg-red-500', text: 'text-red-600' },
    중: { label: 'MED', dot: 'bg-amber-400', text: 'text-amber-600' },
    하: { label: 'LOW', dot: 'bg-emerald-400', text: 'text-emerald-600' },
  };
  const { label, dot, text } = configs[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function getProgressColor(value: number): string {
  if (value <= 30) return 'bg-red-500';
  if (value <= 70) return 'bg-yellow-400';
  return 'bg-emerald-500';
}

function ProgressBar({ value }: { value: number }) {
  const color = getProgressColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{value}%</span>
    </div>
  );
}

type TabKey = 'all' | 'myteam' | 'flagged';

// ────────────────────────────────────────────
// New Update Modal
// ────────────────────────────────────────────

type NewEntryCategory = '일반업무' | '프로젝트' | '기타';

interface NewEntryForm {
  authorName: string;
  category: NewEntryCategory;
  company: Company | '';
  taskType: TaskType | '';
  projectName: string;
  thisWeek: string;
  nextWeek: string;
  progress: number;
  status: SyncStatus;
  priority: SyncPriority;
  hasIssue: boolean;
  issueText: string;
}

const DEFAULT_NEW_ENTRY: NewEntryForm = {
  authorName: '',
  category: '일반업무',
  company: '',
  taskType: '',
  projectName: '',
  thisWeek: '',
  nextWeek: '',
  progress: 0,
  status: 'IN_PROGRESS',
  priority: '중',
  hasIssue: false,
  issueText: '',
};

const CATEGORY_OPTIONS: NewEntryCategory[] = ['일반업무', '프로젝트', '기타'];

const STATUS_OPTIONS: { value: SyncStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'DELAYED', label: 'DELAYED' },
];

const PRIORITY_OPTIONS: { value: SyncPriority; label: string; color: string; active: string }[] = [
  { value: '상', label: 'HIGH', color: 'border-red-200 text-red-600', active: 'bg-red-500 text-white border-red-500' },
  { value: '중', label: 'MED', color: 'border-amber-200 text-amber-600', active: 'bg-amber-400 text-white border-amber-400' },
  { value: '하', label: 'LOW', color: 'border-emerald-200 text-emerald-600', active: 'bg-emerald-500 text-white border-emerald-500' },
];

function NewUpdateModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (entry: SyncEntry) => void;
}) {
  const [form, setForm] = useState<NewEntryForm>(DEFAULT_NEW_ENTRY);

  const update = <K extends keyof NewEntryForm>(key: K, value: NewEntryForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        next.company = '';
        next.taskType = '';
        next.projectName = '';
      }
      return next;
    });
  };

  const progressColor = getProgressColor(form.progress);
  const progressColorText =
    form.progress <= 30 ? 'text-red-500' : form.progress <= 70 ? 'text-yellow-500' : 'text-emerald-500';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const categoryLabel =
      form.category === '일반업무'
        ? form.taskType || '일반업무'
        : form.category === '프로젝트'
        ? form.projectName || '프로젝트'
        : '기타';

    const companyLabel = form.company || '미지정';
    const companyColor = form.company ? (COMPANY_COLORS[form.company] ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-600';
    const avatarBg = AVATAR_BG_POOL[Math.floor(Math.random() * AVATAR_BG_POOL.length)];

    const newEntry: SyncEntry = {
      id: String(Date.now()),
      authorName: form.authorName,
      avatarBg,
      company: companyLabel,
      companyColor,
      category: categoryLabel,
      thisWeek: form.thisWeek,
      nextWeek: form.nextWeek,
      progress: form.progress,
      priority: form.priority,
      status: form.status,
      hasIssue: form.hasIssue,
      issueText: form.hasIssue ? form.issueText : undefined,
    };

    onAdd(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-black text-slate-900">주간보고 작성</h2>
            <p className="text-xs text-slate-400 mt-0.5">2026년 3월 1주차</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Author */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              MEMBER
            </label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={form.authorName}
              onChange={(e) => update('authorName', e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              CATEGORY
            </label>
            <div className="flex gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                    form.category === cat
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 일반업무: 회사 선택 + 업무 항목 */}
          {form.category === '일반업무' && (
            <>
              {/* 회사 선택 */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                  회사 선택
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_OPTIONS.map((co) => (
                    <button
                      key={co}
                      type="button"
                      onClick={() => update('company', co)}
                      className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                        form.company === co
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                      }`}
                    >
                      {co}
                    </button>
                  ))}
                </div>
              </div>

              {/* 업무 항목 */}
              <div>
                <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                  업무 항목
                </label>
                <div className="flex gap-2">
                  {TASK_TYPE_OPTIONS.map((tt) => (
                    <button
                      key={tt}
                      type="button"
                      onClick={() => update('taskType', tt)}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                        form.taskType === tt
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-600'
                      }`}
                    >
                      {tt}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 프로젝트: 프로젝트명 입력 */}
          {form.category === '프로젝트' && (
            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                프로젝트명
              </label>
              <input
                type="text"
                placeholder="프로젝트명을 입력하세요"
                value={form.projectName}
                onChange={(e) => update('projectName', e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          )}

          {/* This Week */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              THIS WEEK
            </label>
            <textarea
              placeholder="이번 주 주요 업무 내용을 작성하세요"
              value={form.thisWeek}
              onChange={(e) => update('thisWeek', e.target.value)}
              rows={3}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Next Week */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              NEXT WEEK
            </label>
            <textarea
              placeholder="다음 주 계획을 작성하세요"
              value={form.nextWeek}
              onChange={(e) => update('nextWeek', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Progress */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              PROGRESS
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">진도율</span>
                <span className={`text-sm font-black ${progressColorText}`}>{form.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100">
                <div
                  className={`h-full ${progressColor} transition-all`}
                  style={{ width: `${form.progress}%` }}
                />
              </div>
            </div>
            <div className="mt-2 px-1">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progress}
                onChange={(e) => update('progress', Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${form.progress <= 30 ? '#ef4444' : form.progress <= 70 ? '#facc15' : '#10b981'} ${form.progress}%, #e2e8f0 ${form.progress}%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>0%</span>
                <span className="text-red-400">30%</span>
                <span className="text-yellow-500">70%</span>
                <span className="text-emerald-500">100%</span>
              </div>
            </div>
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                STATUS
              </label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value as SyncStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                PRIORITY
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('priority', opt.value)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      form.priority === opt.value ? opt.active : `bg-white ${opt.color} hover:opacity-70`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Issue toggle + text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase">
                ISSUE / 특이사항
              </label>
              <button
                type="button"
                onClick={() => update('hasIssue', !form.hasIssue)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  form.hasIssue
                    ? 'bg-red-100 text-red-600 border border-red-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {form.hasIssue ? '이슈 있음' : '이슈 없음'}
              </button>
            </div>
            {form.hasIssue && (
              <textarea
                placeholder="이슈 또는 특이사항을 입력하세요"
                value={form.issueText}
                onChange={(e) => update('issueText', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-slate-900 text-sm placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200"
            >
              <Plus size={14} />
              보고서 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// User Profile Modal
// ────────────────────────────────────────────

function UserProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => void;
}) {
  const [form, setForm] = useState<UserProfile>(profile);

  const update = (key: keyof UserProfile, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">내 프로필</h2>
              <p className="text-xs text-slate-400">기본 정보를 입력·수정하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
            {form.name ? form.name.slice(0, 1) : '?'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">이름</label>
            <input
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">이메일</label>
            <input
              type="email"
              placeholder="example@company.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">담당 업무</label>
            <input
              type="text"
              placeholder="예: 인사팀 채용 담당"
              value={form.jobTitle}
              onChange={(e) => update('jobTitle', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">입사일</label>
            <input
              type="date"
              value={form.joinDate}
              onChange={(e) => update('joinDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
            >
              <Save size={14} />
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Notice Modal
// ────────────────────────────────────────────

function NoticeModal({
  notices,
  onClose,
  onAdd,
  onDelete,
}: {
  notices: NoticeItem[];
  onClose: () => void;
  onAdd: (content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">공지사항</h2>
              <p className="text-xs text-slate-400">팀에게 공지할 내용을 등록하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-slate-100">
          <textarea
            placeholder="공지 내용을 입력하세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!text.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Flag size={13} />
              공지 등록
            </button>
          </div>
        </div>

        {/* Notice list */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-2.5">
          {notices.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">등록된 공지가 없습니다.</p>
          ) : (
            [...notices].reverse().map((notice) => (
              <div
                key={notice.id}
                className="flex items-start gap-3 px-3 py-3 bg-orange-50 border border-orange-100 rounded-xl group"
              >
                <Flag size={13} className="text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-relaxed">{notice.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{notice.createdAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(notice.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────

export function WeeklySyncPage() {
  const [entries, setEntries] = useState<SyncEntry[]>(INITIAL_SYNC_DATA);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewUpdateModal, setShowNewUpdateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    jobTitle: '',
    joinDate: '',
  });

  const [notices, setNotices] = useState<NoticeItem[]>([]);

  const handleAddEntry = (entry: SyncEntry) => {
    setEntries((prev) => [...prev, entry]);
  };

  const handleAddNotice = (content: string) => {
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setNotices((prev) => [
      ...prev,
      { id: String(Date.now()), content, createdAt },
    ]);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const totalCount = entries.length;
  const completedCount = entries.filter((e) => e.status === 'COMPLETED').length;
  const inProgressCount = entries.filter((e) => e.status === 'IN_PROGRESS').length;
  const issueCount = entries.filter((e) => e.hasIssue).length;
  const avgProgress = totalCount > 0
    ? Math.round(entries.reduce((s, e) => s + e.progress, 0) / totalCount)
    : 0;

  const filteredData = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === '' ||
      entry.authorName.includes(searchQuery) ||
      entry.category.includes(searchQuery) ||
      entry.company.includes(searchQuery) ||
      entry.thisWeek.includes(searchQuery);

    if (activeTab === 'flagged') return matchesSearch && entry.hasIssue;
    if (activeTab === 'myteam')
      return matchesSearch && ['김민준', '정우진', '이서연'].includes(entry.authorName);
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {showNewUpdateModal && (
        <NewUpdateModal
          onClose={() => setShowNewUpdateModal(false)}
          onAdd={handleAddEntry}
        />
      )}
      {showProfile && (
        <UserProfileModal
          profile={userProfile}
          onClose={() => setShowProfile(false)}
          onSave={(p) => setUserProfile(p)}
        />
      )}
      {showNotice && (
        <NoticeModal
          notices={notices}
          onClose={() => setShowNotice(false)}
          onAdd={handleAddNotice}
          onDelete={handleDeleteNotice}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
        {/* Logo mark */}
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center mb-2">
          <BarChart2 size={18} className="text-white" />
        </div>

        <button
          onClick={() => {}}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-500 transition-colors"
          title="대시보드"
        >
          <LayoutDashboard size={18} />
        </button>

        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          title="내 프로필"
        >
          <Users size={18} />
        </button>

        <button
          onClick={() => {}}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          title="트렌드"
        >
          <TrendingUp size={18} />
        </button>

        <button
          onClick={() => setShowNotice(true)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative ${
            notices.length > 0
              ? 'text-orange-500 hover:bg-orange-50'
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="공지사항"
        >
          <Flag size={18} />
          {notices.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </button>

        <div className="mt-auto">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top bar ── */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-lg font-black text-slate-900 tracking-tight">VNTG</span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Weekly
            </span>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="멤버, 카테고리, 회사 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 placeholder-slate-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              2026년 3월 1주차
              <ChevronDown size={13} />
            </button>

            <button
              onClick={() => setShowNotice(true)}
              className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell size={16} />
              {(issueCount > 0 || notices.length > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-orange-600 transition-colors"
              title="내 프로필"
            >
              {userProfile.name ? userProfile.name.slice(0, 1) : '나'}
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Notice banner */}
          {notices.length > 0 && (
            <div
              className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => setShowNotice(true)}
            >
              <Megaphone size={15} className="text-orange-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-orange-600 mr-2">공지</span>
                <span className="text-xs text-orange-700 line-clamp-1">
                  {notices[notices.length - 1].content}
                </span>
              </div>
              <span className="text-[10px] text-orange-400 shrink-0">
                총 {notices.length}건
              </span>
            </div>
          )}

          {/* Page heading */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">Weekly Reporting Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                2026년 3월 1주차 &middot; 총 {totalCount}명 참여
              </p>
            </div>
            <button
              onClick={() => setShowNewUpdateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200"
            >
              <Plus size={15} />
              New Update
            </button>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: 'AVG PROGRESS',
                value: `${avgProgress}%`,
                sub: '팀 평균 진도율',
                color: 'text-orange-500',
                icon: <TrendingUp size={14} className="text-orange-400" />,
              },
              {
                label: 'COMPLETED',
                value: String(completedCount),
                sub: `/ ${totalCount} 제출 완료`,
                color: 'text-emerald-600',
                icon: <CheckCircle2 size={14} className="text-emerald-400" />,
              },
              {
                label: 'IN PROGRESS',
                value: String(inProgressCount),
                sub: '진행 중',
                color: 'text-blue-600',
                icon: <Clock size={14} className="text-blue-400" />,
              },
              {
                label: 'ISSUES',
                value: String(issueCount),
                sub: '즉시 확인 필요',
                color: 'text-red-600',
                icon: <AlertTriangle size={14} className="text-red-400" />,
              },
            ].map(({ label, value, sub, color, icon }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {label}
                  </span>
                  {icon}
                </div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Executive Summary ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Executive Summary &amp; Issue Highlights
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  팀 전체 주간 진도 요약 — 이슈가 있는 항목은 즉시 확인하세요.
                </p>
              </div>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                {avgProgress}% 달성
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>팀 전체 평균 진도율</span>
                <span className="font-semibold text-slate-700">{avgProgress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
            </div>

            {issueCount > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Issue Highlights
                </p>
                {entries.filter((e) => e.hasIssue).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-red-700">{entry.authorName}</span>
                      <span className="text-xs text-red-500 ml-2">{entry.issueText}</span>
                    </div>
                    <StatusBadge status={entry.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tabs + Table ── */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Tab nav */}
            <div className="flex items-center border-b border-slate-200 px-4">
              {(
                [
                  { key: 'all', label: 'All Members', count: entries.length },
                  {
                    key: 'myteam',
                    label: 'My Team',
                    count: entries.filter((e) =>
                      ['김민준', '정우진', '이서연'].includes(e.authorName)
                    ).length,
                  },
                  {
                    key: 'flagged',
                    label: 'Flagged Issues',
                    count: entries.filter((e) => e.hasIssue).length,
                  },
                ] as { key: TabKey; label: string; count: number }[]
              ).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === key
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {[
                      'MEMBER',
                      'COMPANY',
                      'CATEGORY',
                      'THIS WEEK',
                      'NEXT WEEK',
                      'PROGRESS',
                      'STATUS',
                      'PRIORITY',
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-slate-100 hover:bg-orange-50/40 transition-colors cursor-pointer ${
                          entry.hasIssue ? 'bg-red-50/20' : ''
                        }`}
                      >
                        {/* MEMBER */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={entry.authorName} bgClass={entry.avatarBg} />
                            <p className="font-semibold text-slate-800 text-sm leading-tight">
                              {entry.authorName}
                            </p>
                          </div>
                        </td>

                        {/* COMPANY */}
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.companyColor}`}
                          >
                            {entry.company}
                          </span>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">
                            {entry.category}
                          </span>
                        </td>

                        {/* THIS WEEK */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                            {entry.thisWeek}
                          </p>
                          {entry.hasIssue && (
                            <p className="text-[10px] text-red-500 font-medium mt-1 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              {entry.issueText}
                            </p>
                          )}
                        </td>

                        {/* NEXT WEEK */}
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {entry.nextWeek}
                          </p>
                        </td>

                        {/* PROGRESS */}
                        <td className="px-4 py-3">
                          <ProgressBar value={entry.progress} />
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3">
                          <StatusBadge status={entry.status} />
                        </td>

                        {/* PRIORITY */}
                        <td className="px-4 py-3">
                          <PriorityDot priority={entry.priority} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-400">
                {filteredData.length}명 표시 중 (전체 {totalCount}명)
              </p>
              <p className="text-xs text-slate-400">
                마지막 업데이트: 2026-03-05 00:00
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
