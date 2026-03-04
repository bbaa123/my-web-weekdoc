import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, ArrowLeft, ClipboardEdit } from 'lucide-react';
import type { WeeklyReport } from '../types';
import { ReportCard } from '../components/ReportCard';
import { QuickFeedbackPopover } from '../components/QuickFeedbackPopover';

const MOCK_REPORTS: WeeklyReport[] = [
  {
    id: '1',
    authorId: 'u1',
    authorName: '김민준',
    weekStart: '2026-03-02',
    workType: '프로젝트',
    projectName: '고객 포털 리뉴얼',
    summary:
      '로그인/회원가입 UI 재설계 및 API 연동 작업 완료. 디자인 시스템 토큰 적용 마무리. 다음 주 QA 예정.',
    progress: 85,
    priority: '상',
    issues: '외부 OAuth 서버 응답 속도 이슈 발생. 임시 캐싱으로 대응 중.',
    status: '제출 완료',
    createdAt: '2026-03-04T10:00:00Z',
    updatedAt: '2026-03-04T10:00:00Z',
  },
  {
    id: '2',
    authorId: 'u2',
    authorName: '이서연',
    weekStart: '2026-03-02',
    workType: '일반',
    summary: '주간 정기 회의 참석 및 팀 온보딩 자료 업데이트. 신규 입사자 교육 지원.',
    progress: 100,
    priority: '하',
    status: '제출 완료',
    createdAt: '2026-03-04T11:00:00Z',
    updatedAt: '2026-03-04T11:00:00Z',
  },
  {
    id: '3',
    authorId: 'u3',
    authorName: '박지호',
    weekStart: '2026-03-02',
    workType: '프로젝트',
    projectName: '데이터 파이프라인',
    summary: 'ETL 파이프라인 설계 중. 데이터 소스 정의 단계 진행. 아직 초기 단계.',
    progress: 25,
    priority: '중',
    status: '작성 중',
    createdAt: '2026-03-04T09:00:00Z',
    updatedAt: '2026-03-04T09:00:00Z',
  },
  {
    id: '4',
    authorId: 'u4',
    authorName: '최수아',
    weekStart: '2026-03-02',
    workType: '지원',
    summary: '고객사 기술 지원 미팅 3건 처리. 긴급 버그 패치 배포 완료.',
    progress: 70,
    priority: '상',
    issues: '고객사 A 배포 환경이 예상과 달라 추가 검토 필요.',
    status: '피드백 도착',
    createdAt: '2026-03-04T08:00:00Z',
    updatedAt: '2026-03-04T08:00:00Z',
  },
  {
    id: '5',
    authorId: 'u5',
    authorName: '정우진',
    weekStart: '2026-03-02',
    workType: '일반',
    summary: '코드 리뷰 10건 완료. 팀 내 Tailwind 4 마이그레이션 가이드 작성.',
    progress: 90,
    priority: '중',
    status: '제출 완료',
    createdAt: '2026-03-04T12:00:00Z',
    updatedAt: '2026-03-04T12:00:00Z',
  },
  {
    id: '6',
    authorId: 'u6',
    authorName: '한나래',
    weekStart: '2026-03-02',
    workType: '프로젝트',
    projectName: 'AI 추천 엔진',
    summary: 'ML 모델 파인튜닝 및 A/B 테스트 설계 완료. 정확도 지표 수집 중.',
    progress: 55,
    priority: '중',
    status: '작성 중',
    createdAt: '2026-03-04T13:00:00Z',
    updatedAt: '2026-03-04T13:00:00Z',
  },
  {
    id: '7',
    authorId: 'u7',
    authorName: '오승현',
    weekStart: '2026-03-02',
    workType: '일반',
    summary: '인프라 모니터링 대시보드 개선 및 알림 규칙 재설정.',
    progress: 60,
    priority: '중',
    status: '제출 완료',
    createdAt: '2026-03-04T14:00:00Z',
    updatedAt: '2026-03-04T14:00:00Z',
  },
  {
    id: '8',
    authorId: 'u8',
    authorName: '윤지민',
    weekStart: '2026-03-02',
    workType: '기타',
    summary: '사내 해커톤 기획 및 준비. 참가자 모집 완료.',
    progress: 40,
    priority: '하',
    status: '작성 중',
    createdAt: '2026-03-04T15:00:00Z',
    updatedAt: '2026-03-04T15:00:00Z',
  },
];

export function AdminDashboardPage() {
  const [reports, setReports] = useState<WeeklyReport[]>(MOCK_REPORTS);
  const [feedbackTarget, setFeedbackTarget] = useState<WeeklyReport | null>(null);

  const totalCount = reports.length;
  const submittedCount = reports.filter((r) => r.status !== '작성 중').length;
  const highPriorityCount = reports.filter((r) => r.priority === '상').length;
  const issueCount = reports.filter((r) => Boolean(r.issues?.trim())).length;

  const handleFeedbackSubmit = (reportId: string, comment?: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: '피드백 도착',
              feedback: comment,
              feedbackAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  // Sort: high priority + issues first, then by progress asc (most stuck first)
  const sortedReports = [...reports].sort((a, b) => {
    const scoreA = (a.priority === '상' ? 4 : a.priority === '중' ? 2 : 0) + (a.issues ? 2 : 0);
    const scoreB = (b.priority === '상' ? 4 : b.priority === '중' ? 2 : 0) + (b.issues ? 2 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.progress - b.progress;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back + header */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={15} />
            홈으로
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">팀 주간 보고 현황</h1>
              <p className="text-slate-500 text-sm mt-1">
                2026년 3월 1주차 &middot; 총 {totalCount}명
              </p>
            </div>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
            >
              <ClipboardEdit size={15} />
              보고서 작성하기
            </Link>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} className="text-indigo-500" />
              <span className="text-xs font-semibold text-slate-500">제출 완료</span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {submittedCount}
              <span className="text-sm text-slate-400 font-normal ml-1">/ {totalCount}</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-red-500" />
              <span className="text-xs font-semibold text-slate-500">중요도 상</span>
            </div>
            <p className="text-2xl font-black text-red-600">{highPriorityCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-500" />
              <span className="text-xs font-semibold text-slate-500">이슈 보고</span>
            </div>
            <p className="text-2xl font-black text-amber-600">{issueCount}</p>
          </div>
        </div>

        {/* Guide note */}
        {(highPriorityCount > 0 || issueCount > 0) && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
            <AlertTriangle size={14} />
            강조된 카드(빨간 테두리)는 즉시 확인이 필요한 항목입니다.
          </div>
        )}

        {/* Report cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onQuickFeedback={setFeedbackTarget}
            />
          ))}
        </div>
      </div>

      {/* Quick feedback popover */}
      <QuickFeedbackPopover
        report={feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
