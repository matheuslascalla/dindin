import { formatPercent } from '@/lib/utils';

interface ProgressBarProps {
  percent: number;
  status: 'ok' | 'warning' | 'danger';
  showLabel?: boolean;
}

const barColors = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export function ProgressBar({ percent, status, showLabel = false }: ProgressBarProps) {
  const width = Math.min(Math.max(percent, 0), 100);

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColors[status]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-slate-400">{formatPercent(percent)}</p>}
    </div>
  );
}
