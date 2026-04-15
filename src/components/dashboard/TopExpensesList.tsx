import { ContentCard } from '@/components/ui/ContentCard';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { formatCurrency } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import type { TopExpense } from '@/server/actions/dashboard';

interface TopExpensesListProps {
  expenses: TopExpense[];
}

export function TopExpensesList({ expenses }: TopExpensesListProps) {
  return (
    <ContentCard title="Top 5 Maiores Gastos">
      {expenses.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Sem gastos neste mês</p>
      ) : (
        <div className="space-y-0">
          {expenses.map((exp, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
            >
              <span className="w-4 shrink-0 font-mono text-xs text-slate-300">{i + 1}</span>

              <div className="min-w-0 flex-1">
                <div className="flex gap-3">
                  <p className="truncate text-sm font-medium text-slate-900">{exp.name}</p>

                  <CategoryBadge
                    color={exp.categoryColor}
                    name={exp.categoryName}
                    icon={exp.categoryIcon}
                  />
                </div>

                <div className="mt-0.5 flex gap-2">
                  {exp.source === 'card' && exp.cardName && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <CreditCard size={10} />
                      {exp.cardName}
                    </span>
                  )}

                  {exp.person && <span className="text-xs text-slate-400">{exp.person}</span>}
                </div>
              </div>

              <span className="shrink-0 text-sm font-semibold text-red-500">
                {formatCurrency(exp.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </ContentCard>
  );
}
