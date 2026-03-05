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
  Pencil,
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
  weekLabel?: string;
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

const CURRENT_WEEK_LABEL = '2026년 3월 1주차';

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

const PREV_WEEK_ENTRIES: SyncEntry[] = [
  {
    id: 'pw-1',
    authorName: '김민준',
    avatarBg: 'bg-orange-500',
    company: '세아특수강',
    companyColor: 'bg-blue-100 text-blue-700',
    category: '제품개발',
    thisWeek: '고객 포털 인증 모듈 설계 착수. 기술 스펙 문서 작성 및 팀 리뷰 진행.',
    nextWeek: '고객 포털 로그인/회원가입 UI 재설계 및 OAuth API 연동 착수.',
    progress: 60,
    priority: '상',
    status: 'IN_PROGRESS',
    hasIssue: false,
    weekLabel: '2026년 2월 4주차',
  },
  {
    id: 'pw-2',
    authorName: '이서연',
    avatarBg: 'bg-violet-500',
    company: '세아M&S',
    companyColor: 'bg-green-100 text-green-700',
    category: '온보딩',
    thisWeek: '신규 입사자 온보딩 자료 1차 초안 작성. 기존 자료 검토 및 개선 방향 논의.',
    nextWeek: '주간 정기 회의 참석 및 팀 온보딩 자료 전면 업데이트.',
    progress: 50,
    priority: '하',
    status: 'IN_PROGRESS',
    hasIssue: false,
    weekLabel: '2026년 2월 4주차',
  },
  {
    id: 'pw-3',
    authorName: '최수아',
    avatarBg: 'bg-rose-500',
    company: '세아베스틸 지주',
    companyColor: 'bg-amber-100 text-amber-700',
    category: '고객지원',
    thisWeek: '고객사 월간 정기 지원 미팅 진행. 이슈 트래커 백로그 정리.',
    nextWeek: '고객사 기술 지원 미팅 3건 처리. 긴급 버그 패치 배포.',
    progress: 80,
    priority: '중',
    status: 'COMPLETED',
    hasIssue: false,
    weekLabel: '2026년 2월 4주차',
  },
  {
    id: 'pw-4',
    authorName: '강도현',
    avatarBg: 'bg-teal-500',
    company: '세아홀딩스',
    companyColor: 'bg-violet-100 text-violet-700',
    category: '보안',
    thisWeek: '보안 감사 계획서 작성 및 외부 감사 업체 선정 진행.',
    nextWeek: '취약점 점검 보고서 작성. 인증 모듈 보안 감사 착수.',
    progress: 20,
    priority: '상',
    status: 'IN_PROGRESS',
    hasIssue: true,
    issueText: '외부 보안 감사 업체 일정 협의 중 — 최종 확정 필요',
    weekLabel: '2026년 2월 4주차',
  },
  {
    id: 'pw-5',
    authorName: '박지호',
    avatarBg: 'bg-emerald-500',
    company: '세아홀딩스',
    companyColor: 'bg-violet-100 text-violet-700',
    category: '데이터',
    thisWeek: '데이터 분석 요구사항 수집 및 현황 파악. 이해관계자 인터뷰 3회 진행.',
    nextWeek: 'ETL 파이프라인 설계 착수. 데이터 소스 정의 및 스키마 초안 작성.',
    progress: 15,
    priority: '중',
    status: 'IN_PROGRESS',
    hasIssue: false,
    weekLabel: '2026년 2월 4주차',
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
type ViewMode = 'dashboard' | 'entries';

// ────────────────────────────────────────────
// New Update Modal (Multi-row)
// ────────────────────────────────────────────

type NewEntryCategory = '일반업무' | '프로젝트' | '기타';

interface EntryRow {
  rowId: string;
  fromLastWeek: boolean;
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

function makeDefaultRow(): EntryRow {
  return {
    rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fromLastWeek: false,
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
}

function EntryRowCard({
  row,
  index,
  total,
  onUpdate,
  onRemove,
}: {
  row: EntryRow;
  index: number;
  total: number;
  onUpdate: (rowId: string, key: keyof EntryRow, value: EntryRow[keyof EntryRow]) => void;
  onRemove: (rowId: string) => void;
}) {
  const up = <K extends keyof EntryRow>(key: K, value: EntryRow[K]) =>
    onUpdate(row.rowId, key, value);

  const progressColor = getProgressColor(row.progress);
  const progressColorText =
    row.progress <= 30 ? 'text-red-500' : row.progress <= 70 ? 'text-yellow-500' : 'text-emerald-500';

  return (
    <div
      className={`border rounded-xl p-4 space-y-4 ${
        row.fromLastWeek
          ? 'border-amber-200 bg-amber-50/30'
          : 'border-slate-200 bg-white'
      }`}
    >
      {/* Row header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          {row.fromLastWeek && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              지난주 미완료 인계
            </span>
          )}
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(row.rowId)}
            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
          CATEGORY
        </label>
        <div className="flex gap-2">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                up('category', cat);
                up('company', '');
                up('taskType', '');
                up('projectName', '');
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${
                row.category === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 일반업무: 회사 선택 + 업무 항목 드롭다운 */}
      {row.category === '일반업무' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              회사 선택
            </label>
            <div className="relative">
              <select
                value={row.company}
                onChange={(e) => up('company', e.target.value as Company | '')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="">회사를 선택하세요</option>
                {COMPANY_OPTIONS.map((co) => (
                  <option key={co} value={co}>
                    {co}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
              업무 항목
            </label>
            <div className="relative">
              <select
                value={row.taskType}
                onChange={(e) => up('taskType', e.target.value as TaskType | '')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="">항목을 선택하세요</option>
                {TASK_TYPE_OPTIONS.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트: 프로젝트명 */}
      {row.category === '프로젝트' && (
        <div>
          <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
            프로젝트명
          </label>
          <input
            type="text"
            placeholder="프로젝트명을 입력하세요"
            value={row.projectName}
            onChange={(e) => up('projectName', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
          />
        </div>
      )}

      {/* This Week */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
          THIS WEEK
          {row.fromLastWeek && row.thisWeek && (
            <span className="ml-2 text-amber-500 normal-case font-normal tracking-normal">
              ← 지난주 NEXT WEEK 자동 입력
            </span>
          )}
        </label>
        <textarea
          placeholder="이번 주 주요 업무 내용을 작성하세요"
          value={row.thisWeek}
          onChange={(e) => up('thisWeek', e.target.value)}
          rows={3}
          required
          className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none leading-relaxed ${
            row.fromLastWeek && row.thisWeek
              ? 'border-amber-200 bg-amber-50/40 focus:ring-amber-300 focus:border-amber-400'
              : 'border-slate-200 bg-slate-50 focus:ring-orange-300 focus:border-orange-400'
          }`}
        />
      </div>

      {/* Next Week */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
          NEXT WEEK
        </label>
        <textarea
          placeholder="다음 주 계획을 작성하세요"
          value={row.nextWeek}
          onChange={(e) => up('nextWeek', e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none leading-relaxed"
        />
      </div>

      {/* Progress */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
          PROGRESS
        </label>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all`}
              style={{ width: `${row.progress}%` }}
            />
          </div>
          <span className={`text-sm font-black w-10 text-right shrink-0 ${progressColorText}`}>
            {row.progress}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={row.progress}
          onChange={(e) => up('progress', Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${
              row.progress <= 30 ? '#ef4444' : row.progress <= 70 ? '#facc15' : '#10b981'
            } ${row.progress}%, #e2e8f0 ${row.progress}%)`,
          }}
        />
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
            STATUS
          </label>
          <select
            value={row.status}
            onChange={(e) => up('status', e.target.value as SyncStatus)}
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
          <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1.5">
            PRIORITY
          </label>
          <div className="flex gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => up('priority', opt.value)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  row.priority === opt.value ? opt.active : `bg-white ${opt.color} hover:opacity-70`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Issue */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            ISSUE / 특이사항
          </label>
          <button
            type="button"
            onClick={() => up('hasIssue', !row.hasIssue)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
              row.hasIssue
                ? 'bg-red-100 text-red-600 border border-red-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {row.hasIssue ? '이슈 있음' : '이슈 없음'}
          </button>
        </div>
        {row.hasIssue && (
          <textarea
            placeholder="이슈 또는 특이사항을 입력하세요"
            value={row.issueText}
            onChange={(e) => up('issueText', e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-slate-900 text-sm placeholder:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none"
          />
        )}
      </div>
    </div>
  );
}

function NewUpdateModal({
  onClose,
  onAdd,
  defaultAuthorName,
  lastWeekIncomplete,
  currentWeekLabel,
}: {
  onClose: () => void;
  onAdd: (entries: SyncEntry[]) => void;
  defaultAuthorName: string;
  lastWeekIncomplete: SyncEntry[];
  currentWeekLabel: string;
}) {
  const buildRowFromLastWeek = (entry: SyncEntry): EntryRow => ({
    rowId: `row-lw-${entry.id}`,
    fromLastWeek: true,
    category: '일반업무',
    company: (COMPANY_OPTIONS.includes(entry.company as Company) ? entry.company : '') as Company | '',
    taskType: (TASK_TYPE_OPTIONS.includes(entry.category as TaskType) ? entry.category : '') as TaskType | '',
    projectName: '',
    thisWeek: entry.nextWeek,
    nextWeek: '',
    progress: entry.progress < 100 ? entry.progress : 0,
    status: 'IN_PROGRESS',
    priority: entry.priority,
    hasIssue: false,
    issueText: '',
  });

  const initialRows: EntryRow[] =
    lastWeekIncomplete.length > 0
      ? lastWeekIncomplete.map(buildRowFromLastWeek)
      : [makeDefaultRow()];

  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [rows, setRows] = useState<EntryRow[]>(initialRows);

  const updateRow = (rowId: string, key: keyof EntryRow, value: EntryRow[keyof EntryRow]) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [key]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, makeDefaultRow()]);

  const removeRow = (rowId: string) => setRows((prev) => prev.filter((r) => r.rowId !== rowId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const avatarBg = AVATAR_BG_POOL[Math.floor(Math.random() * AVATAR_BG_POOL.length)];

    const newEntries: SyncEntry[] = rows.map((row) => {
      const categoryLabel =
        row.category === '일반업무'
          ? row.taskType || '일반업무'
          : row.category === '프로젝트'
          ? row.projectName || '프로젝트'
          : '기타';

      const companyLabel = row.company || '미지정';
      const companyColor = row.company
        ? (COMPANY_COLORS[row.company] ?? 'bg-slate-100 text-slate-600')
        : 'bg-slate-100 text-slate-600';

      return {
        id: `${Date.now()}-${row.rowId}`,
        authorName,
        avatarBg,
        company: companyLabel,
        companyColor,
        category: categoryLabel,
        thisWeek: row.thisWeek,
        nextWeek: row.nextWeek,
        progress: row.progress,
        priority: row.priority,
        status: row.status,
        hasIssue: row.hasIssue,
        issueText: row.hasIssue ? row.issueText : undefined,
        weekLabel: currentWeekLabel,
      };
    });

    onAdd(newEntries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-base font-black text-slate-900">주간보고 작성</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentWeekLabel} · {rows.length}개 항목
              {lastWeekIncomplete.length > 0 && (
                <span className="ml-2 text-amber-500">
                  (지난주 미완료 {lastWeekIncomplete.length}건 자동 인계)
                </span>
              )}
            </p>
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
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Rows */}
          <div className="space-y-4">
            {rows.map((row, index) => (
              <EntryRowCard
                key={row.rowId}
                row={row}
                index={index}
                total={rows.length}
                onUpdate={updateRow}
                onRemove={removeRow}
              />
            ))}
          </div>

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 border-2 border-dashed border-slate-200 rounded-xl hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/30 transition-all"
          >
            <Plus size={15} />
            행 추가
          </button>

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
              보고서 등록 ({rows.length}건)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Edit / Add Entry Modal (전체 보고 내역 뷰에서 사용)
// ────────────────────────────────────────────

function entryToRow(entry: SyncEntry): EntryRow {
  return {
    rowId: `row-edit-${entry.id}`,
    fromLastWeek: false,
    category: '일반업무',
    company: COMPANY_OPTIONS.includes(entry.company as Company) ? (entry.company as Company) : '',
    taskType: TASK_TYPE_OPTIONS.includes(entry.category as TaskType) ? (entry.category as TaskType) : '',
    projectName: '',
    thisWeek: entry.thisWeek,
    nextWeek: entry.nextWeek,
    progress: entry.progress,
    status: entry.status,
    priority: entry.priority,
    hasIssue: entry.hasIssue,
    issueText: entry.issueText ?? '',
  };
}

function EditEntryModal({
  entry,
  onClose,
  onSave,
  weekOptions,
}: {
  entry: SyncEntry | null;
  onClose: () => void;
  onSave: (saved: SyncEntry) => void;
  weekOptions: string[];
}) {
  const isNew = !entry;
  const [authorName, setAuthorName] = useState(entry?.authorName ?? '');
  const [weekLabel, setWeekLabel] = useState(entry?.weekLabel ?? CURRENT_WEEK_LABEL);
  const [row, setRow] = useState<EntryRow>(() =>
    entry ? entryToRow(entry) : makeDefaultRow()
  );

  const updateRow = (_rowId: string, key: keyof EntryRow, value: EntryRow[keyof EntryRow]) => {
    setRow((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryLabel =
      row.category === '일반업무'
        ? row.taskType || '일반업무'
        : row.category === '프로젝트'
        ? row.projectName || '프로젝트'
        : '기타';
    const companyLabel = row.company || (entry?.company ?? '미지정');
    const companyColor = row.company
      ? (COMPANY_COLORS[row.company] ?? 'bg-slate-100 text-slate-600')
      : (entry?.companyColor ?? 'bg-slate-100 text-slate-600');

    const saved: SyncEntry = {
      id: entry?.id ?? `${Date.now()}`,
      authorName,
      avatarBg: entry?.avatarBg ?? AVATAR_BG_POOL[Math.floor(Math.random() * AVATAR_BG_POOL.length)],
      company: companyLabel,
      companyColor,
      category: categoryLabel,
      thisWeek: row.thisWeek,
      nextWeek: row.nextWeek,
      progress: row.progress,
      priority: row.priority,
      status: row.status,
      hasIssue: row.hasIssue,
      issueText: row.hasIssue ? row.issueText : undefined,
      weekLabel,
    };
    onSave(saved);
    onClose();
  };

  const allWeekOptions = Array.from(new Set([...weekOptions, CURRENT_WEEK_LABEL])).sort().reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {isNew ? '보고 내역 추가' : '보고 내역 수정'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isNew
                ? '새로운 보고 항목을 등록합니다'
                : `${entry!.authorName} · ${entry!.weekLabel ?? CURRENT_WEEK_LABEL}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Member + Week */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                MEMBER
              </label>
              <input
                type="text"
                placeholder="이름을 입력하세요"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-slate-400 uppercase mb-1.5">
                WEEK
              </label>
              <div className="relative">
                <select
                  value={weekLabel}
                  onChange={(e) => setWeekLabel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all cursor-pointer appearance-none pr-8"
                >
                  {allWeekOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <EntryRowCard
            row={row}
            index={0}
            total={1}
            onUpdate={updateRow}
            onRemove={() => {}}
          />

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
              <Save size={14} />
              {isNew ? '등록하기' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// All Entries View (TrendingUp 버튼 클릭 시)
// ────────────────────────────────────────────

function AllEntriesView({
  entries,
  onAdd,
  onEdit,
  onDelete,
}: {
  entries: SyncEntry[];
  onAdd: (entry: SyncEntry) => void;
  onEdit: (entry: SyncEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [weekFilter, setWeekFilter] = useState('');
  const [editingEntry, setEditingEntry] = useState<SyncEntry | null | 'new'>(null);

  const weekOptions = Array.from(
    new Set(entries.map((e) => e.weekLabel ?? CURRENT_WEEK_LABEL))
  ).sort().reverse();

  const filteredEntries = weekFilter
    ? entries.filter((e) => (e.weekLabel ?? CURRENT_WEEK_LABEL) === weekFilter)
    : entries;

  const handleSave = (saved: SyncEntry) => {
    if (editingEntry === 'new') {
      onAdd(saved);
    } else if (editingEntry) {
      onEdit(saved);
    }
    setEditingEntry(null);
  };

  return (
    <>
      {editingEntry !== null && (
        <EditEntryModal
          entry={editingEntry === 'new' ? null : editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSave}
          weekOptions={weekOptions}
        />
      )}

      {/* Page heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">전체 보고 내역</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            작성된 모든 주간보고를 확인하고 수정할 수 있습니다 · 총 {entries.length}건
          </p>
        </div>
        <button
          onClick={() => setEditingEntry('new')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200"
        >
          <Plus size={15} />
          행 추가
        </button>
      </div>

      {/* Week filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 mr-1">주차 필터:</span>
        <button
          onClick={() => setWeekFilter('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            weekFilter === ''
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'
          }`}
        >
          전체
        </button>
        {weekOptions.map((week) => (
          <button
            key={week}
            onClick={() => setWeekFilter(weekFilter === week ? '' : week)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              weekFilter === week
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500'
            }`}
          >
            {week}
          </button>
        ))}
      </div>

      {/* Grid Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['WEEK', 'MEMBER', 'COMPANY', 'CATEGORY', 'THIS WEEK', 'NEXT WEEK', 'PROGRESS', 'STATUS', 'PRIORITY', ''].map((col) => (
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
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">
                    등록된 보고 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-slate-100 hover:bg-orange-50/40 transition-colors ${
                      entry.hasIssue ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* WEEK */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {entry.weekLabel ?? CURRENT_WEEK_LABEL}
                      </span>
                    </td>

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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.companyColor}`}>
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
                    <td className="px-4 py-3 max-w-[180px]">
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
                    <td className="px-4 py-3 max-w-[160px]">
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

                    {/* ACTIONS */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            {filteredEntries.length}건 표시 중 (전체 {entries.length}건)
          </p>
          <button
            onClick={() => setEditingEntry('new')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-500 transition-colors"
          >
            <Plus size={12} />
            행 추가
          </button>
        </div>
      </div>
    </>
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
// Notification Panel (Bell 버튼 - 읽기 전용 알림)
// ────────────────────────────────────────────

function NotificationPanel({
  notices,
  onClose,
}: {
  notices: NoticeItem[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">공지사항 알림</h2>
              <p className="text-xs text-slate-400">
                {notices.length > 0 ? `총 ${notices.length}건의 공지` : '새로운 공지가 없습니다'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">새로운 알림이 없습니다</p>
              <p className="text-xs text-slate-300 mt-1">공지사항이 등록되면 여기에 표시됩니다</p>
            </div>
          ) : (
            [...notices].reverse().map((notice, index) => (
              <div
                key={notice.id}
                className="flex items-start gap-3 px-4 py-3.5 bg-orange-50 border border-orange-100 rounded-xl"
              >
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone size={13} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-200/60 px-1.5 py-0.5 rounded">
                      공지 #{notices.length - index}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{notice.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{notice.createdAt}</p>
                </div>
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
  const [entries, setEntries] = useState<SyncEntry[]>([
    ...INITIAL_SYNC_DATA,
    ...PREV_WEEK_ENTRIES,
  ]);
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewUpdateModal, setShowNewUpdateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    jobTitle: '',
    joinDate: '',
  });

  const [notices, setNotices] = useState<NoticeItem[]>([]);

  // 지난주 미완료 항목: 현재 유저(또는 전체)의 미완료 항목 → 팝업 열 때 기본 행으로 셋팅
  const lastWeekIncomplete = userProfile.name
    ? entries.filter(
        (e) =>
          e.authorName === userProfile.name &&
          e.status !== 'COMPLETED'
      )
    : [];

  const handleAddEntries = (newEntries: SyncEntry[]) => {
    setEntries((prev) => [...prev, ...newEntries]);
  };

  const handleEditEntry = (updated: SyncEntry) => {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
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
          onAdd={handleAddEntries}
          defaultAuthorName={userProfile.name}
          lastWeekIncomplete={lastWeekIncomplete}
          currentWeekLabel={CURRENT_WEEK_LABEL}
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
      {showNotification && (
        <NotificationPanel
          notices={notices}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
        {/* Logo mark */}
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center mb-2">
          <BarChart2 size={18} className="text-white" />
        </div>

        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            activeView === 'dashboard'
              ? 'bg-orange-50 text-orange-500'
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
          }`}
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
          onClick={() => setActiveView('entries')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            activeView === 'entries'
              ? 'bg-orange-50 text-orange-500'
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
          }`}
          title="전체 보고 내역"
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
              onClick={() => setShowNotification(true)}
              className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="공지사항 알림"
            >
              <Bell size={16} />
              {notices.length > 0 && (
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
          {/* ── All Entries View ── */}
          {activeView === 'entries' && (
            <AllEntriesView
              entries={entries}
              onAdd={(entry) => handleAddEntries([entry])}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          )}

          {/* ── Dashboard View ── */}
          {activeView === 'dashboard' && (
          <>
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
          </> /* end dashboard view */
          )}
        </main>
      </div>
    </div>
  );
}
