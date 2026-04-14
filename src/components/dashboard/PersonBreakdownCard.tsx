import { ContentCard } from '@/components/ui/ContentCard';
import { formatCurrency } from '@/lib/utils';
import type { PersonBreakdown } from '@/server/actions/dashboard';

interface PersonBreakdownCardProps {
  data: PersonBreakdown[];
  total: number;
}

export function PersonBreakdownCard({ data, total }: PersonBreakdownCardProps) {
  return (
    <ContentCard title="Gastos por Pessoa">
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          Nenhum gasto com pessoa identificada
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((person) => {
            const percent = total > 0 ? (person.totalValue / total) * 100 : 0;
            return (
              <div key={person.person} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{person.person}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{percent.toFixed(1)}%</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(person.totalValue)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ContentCard>
  );
}
