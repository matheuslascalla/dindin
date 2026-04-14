import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  subtexts?: string[];
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  icon?: LucideIcon;
}

const variantClasses = {
  default: 'text-slate-900',
  positive: 'text-green-600',
  negative: 'text-red-500',
  warning: 'text-amber-600',
};

const iconBgClasses = {
  default: 'bg-slate-100 text-slate-400',
  positive: 'bg-green-50 text-green-600',
  negative: 'bg-red-50 text-red-500',
  warning: 'bg-amber-50 text-amber-600',
};

export function MetricCard({
  label,
  value,
  subtext,
  subtexts,
  variant = 'default',
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="mb-1 truncate text-sm font-medium text-slate-500">{label}</p>
        <p className={`text-2xl font-semibold tracking-tight ${variantClasses[variant]}`}>
          {value}
        </p>
        {subtexts
          ? subtexts.map((s, i) => (
              <p key={i} className="mt-1 text-xs text-slate-400">
                {s}
              </p>
            ))
          : subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
      </div>
      {Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBgClasses[variant]}`}
        >
          <Icon size={16} />
        </div>
      )}
    </div>
  );
}
