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
} from 'lucide-react';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

type SyncStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DELAYED';
type SyncPriority = '상' | '중' | '하';

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

// ────────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────────

const SYNC_DATA: SyncEntry[] = [
  {
    id: '1',
    authorName: '김민준',
    avatarBg: 'bg-orange-500',
    company: '본사',
    companyColor: 'bg-slate-800 text-white',
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
    company: 'A사',
    companyColor: 'bg-blue-100 text-blue-700',
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
    company: 'B사',
    companyColor: 'bg-emerald-100 text-emerald-700',
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
    company: '본사',
    companyColor: 'bg-slate-800 text-white',
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
    company: 'A사',
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
    company: 'C사',
    companyColor: 'bg-purple-100 text-purple-700',
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
    company: 'B사',
    companyColor: 'bg-emerald-100 text-emerald-700',
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
    company: '본사',
    companyColor: 'bg-slate-800 text-white',
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
    company: 'C사',
    companyColor: 'bg-purple-100 text-purple-700',
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
    company: 'A사',
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
  const initials = name
    .split('')
    .slice(0, 1)
    .join('');
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

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100
      ? 'bg-emerald-500'
      : value >= 70
        ? 'bg-orange-500'
        : value >= 40
          ? 'bg-blue-500'
          : 'bg-slate-300';
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
// Main Page
// ────────────────────────────────────────────

export function WeeklySyncPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalCount = SYNC_DATA.length;
  const completedCount = SYNC_DATA.filter((e) => e.status === 'COMPLETED').length;
  const inProgressCount = SYNC_DATA.filter((e) => e.status === 'IN_PROGRESS').length;
  const issueCount = SYNC_DATA.filter((e) => e.hasIssue).length;
  const avgProgress = Math.round(SYNC_DATA.reduce((s, e) => s + e.progress, 0) / SYNC_DATA.length);

  const filteredData = SYNC_DATA.filter((entry) => {
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
      {/* ── Sidebar ── */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 shrink-0">
        {/* Logo mark */}
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center mb-2">
          <BarChart2 size={18} className="text-white" />
        </div>

        {[
          { icon: <LayoutDashboard size={18} />, active: true },
          { icon: <Users size={18} />, active: false },
          { icon: <TrendingUp size={18} />, active: false },
          { icon: <Flag size={18} />, active: false },
        ].map(({ icon, active }, i) => (
          <button
            key={i}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              active
                ? 'bg-orange-50 text-orange-500'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {icon}
          </button>
        ))}

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
          {/* Brand */}
          <div className="flex items-center gap-2 mr-4">
            <span className="text-lg font-black text-slate-900 tracking-tight">CorpSync</span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Weekly
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="멤버, 카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 placeholder-slate-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Week label */}
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              2026년 3월 1주차
              <ChevronDown size={13} />
            </button>

            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell size={16} />
              {issueCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              나
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Page heading */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">Weekly Reporting Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                2026년 3월 1주차 &middot; 총 {totalCount}명 참여
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200">
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

            {/* Overall progress bar */}
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

            {/* Issue highlights */}
            {issueCount > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Issue Highlights
                </p>
                {SYNC_DATA.filter((e) => e.hasIssue).map((entry) => (
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
                  { key: 'all', label: 'All Members', count: SYNC_DATA.length },
                  {
                    key: 'myteam',
                    label: 'My Team',
                    count: SYNC_DATA.filter((e) =>
                      ['김민준', '정우진', '이서연'].includes(e.authorName)
                    ).length,
                  },
                  {
                    key: 'flagged',
                    label: 'Flagged Issues',
                    count: SYNC_DATA.filter((e) => e.hasIssue).length,
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
                        colSpan={7}
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
                            <div>
                              <p className="font-semibold text-slate-800 text-sm leading-tight">
                                {entry.authorName}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.companyColor}`}
                              >
                                {entry.company}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded">
                            {entry.category}
                          </span>
                        </td>

                        {/* THIS WEEK */}
                        <td className="px-4 py-3 max-w-[220px]">
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
                        <td className="px-4 py-3 max-w-[200px]">
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
                마지막 업데이트: 2026-03-04 15:30
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
