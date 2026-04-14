import { ContentCard } from '@/components/ui/ContentCard';
import { formatCurrency } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import type { CardSummary } from '@/server/actions/dashboard';

interface CardSummaryCardProps {
  data: CardSummary[];
}

export function CardSummaryCard({ data }: CardSummaryCardProps) {
  return (
    <ContentCard title="Resumo por Cartão">
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Nenhum cartão cadastrado</p>
      ) : (
        <div className="space-y-0">
          {data.map((card) => (
            <div
              key={card.cardId}
              className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                <CreditCard size={14} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{card.cardName}</p>
                <p className="mt-0.5 text-xs text-slate-400">{card.expenseCount} lançamento(s)</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-red-500">
                {formatCurrency(card.totalValue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </ContentCard>
  );
}
