import type { WeeklyReport, Priority } from '../types';
import { StatusDot } from './StatusDot';

interface ReportCardProps {
  report: WeeklyReport;
  onQuickFeedback?: (report: WeeklyReport) => void;
}

function getBarColor(progress: number): string {
  if (progress <= 30) return 'bg-red-400';
  if (progress <= 70) return 'bg-yellow-400';
  return 'bg-green-500';
}

const PRIORITY_BADGE: Record<Priority, string> = {
  상: 'bg-red-50 text-red-600 border-red-200',
  중: 'bg-blue-50 text-blue-600 border-blue-200',
  하: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function ReportCard({ report, onQuickFeedback }: ReportCardProps) {
  const isHighlight = report.priority === '상' || Boolean(report.issues?.trim());
  const barColor = getBarColor(report.progress);

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl p-5 gap-4 transition-all duration-200 hover:shadow-md ${
        isHighlight
          ? 'border-2 border-red-300 shadow-sm shadow-red-50'
          : 'border border-slate-100 shadow-sm'
      }`}
    >
      {/* Header: name + status + priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-bold text-slate-900 leading-tight">{report.authorName}</p>
          <StatusDot status={report.status} />
        </div>
        <span
          className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${PRIORITY_BADGE[report.priority]}`}
        >
          {report.priority}
        </span>
      </div>

      {/* Work type + project */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
          {report.workType}
        </span>
        {report.projectName && (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md">
            {report.projectName}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
        {report.summary}
      </p>

      {/* Issues highlight */}
      {report.issues?.trim() && (
        <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-xs font-bold text-red-600 mb-1">⚠ 이슈/특이사항</p>
          <p className="text-xs text-red-700 leading-relaxed">{report.issues}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500">
          <span>진도율</span>
          <span className="font-semibold">{report.progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${report.progress}%` }}
          />
        </div>
      </div>

      {/* Quick feedback button */}
      <div className="border-t border-slate-50 pt-1">
        <button
          type="button"
          onClick={() => onQuickFeedback?.(report)}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
        >
          확인 완료 / 피드백
        </button>
      </div>
    </div>
  );
}
