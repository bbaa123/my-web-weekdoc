import type { ReportStatus } from '../types';

interface StatusConfig {
  dot: string;
  label: string;
}

const STATUS_CONFIG: Record<ReportStatus, StatusConfig> = {
  '작성 중': { dot: 'bg-yellow-400', label: '작성 중' },
  '제출 완료': { dot: 'bg-green-500', label: '제출 완료' },
  '피드백 도착': { dot: 'bg-blue-500', label: '피드백 도착' },
};

interface StatusDotProps {
  status: ReportStatus;
}

export function StatusDot({ status }: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className="text-xs font-medium text-slate-500">{config.label}</span>
    </span>
  );
}
