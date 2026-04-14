import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { ContentCard } from '@/components/ui/ContentCard';
import { formatPercent } from '@/lib/utils';
import type { CategoryAlert } from '@/server/actions/dashboard';

interface CategoryAlertsProps {
  alerts: CategoryAlert[];
}

export function CategoryAlerts({ alerts }: CategoryAlertsProps) {
  if (alerts.length === 0) {
    return (
      <ContentCard title="Alertas">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Tudo sob controle</p>
          <p className="mt-1 text-xs text-slate-400">Nenhuma categoria passou do limite</p>
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard title={`Alertas (${alerts.length})`}>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${
              alert.status === 'danger'
                ? 'border border-red-200 bg-red-50'
                : 'border border-amber-200 bg-amber-50'
            } `}
          >
            {alert.status === 'danger' ? (
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
            ) : (
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${
                  alert.status === 'danger' ? 'text-red-600' : 'text-amber-700'
                }`}
              >
                {alert.name}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  alert.status === 'danger' ? 'text-red-500' : 'text-amber-600'
                }`}
              >
                {formatPercent(alert.currentPercent)} de {formatPercent(alert.limitPercent)} limite
                {alert.status === 'danger' ? ' — ultrapassado' : ' — próximo do limite'}
              </p>
            </div>
            <div
              className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: alert.color }}
            />
          </div>
        ))}
      </div>
    </ContentCard>
  );
}
