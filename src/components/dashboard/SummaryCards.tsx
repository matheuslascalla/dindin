import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency } from '@/lib/utils';
import type { DashboardSummary } from '@/server/actions/dashboard';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const balanceVariant = summary.balance >= 0 ? 'positive' : 'negative';

  const incomeSubtexts: string[] = [];
  if (summary.eventualIncome > 0)
    incomeSubtexts.push(`+ ${formatCurrency(summary.eventualIncome)} eventual`);
  if (summary.weeklyIncome > 0)
    incomeSubtexts.push(`+ ${formatCurrency(summary.weeklyIncome)} semanal`);
  if (incomeSubtexts.length === 0) incomeSubtexts.push('Rendas mensais ativas');

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Renda Mensal"
        value={formatCurrency(summary.monthlyIncome)}
        subtexts={incomeSubtexts}
        variant="positive"
        icon={TrendingUp}
      />
      <MetricCard
        label="Total de Gastos"
        value={formatCurrency(summary.totalExpenses)}
        subtext="Gastos + cartões no mês"
        variant={summary.totalExpenses > 0 ? 'negative' : 'default'}
        icon={TrendingDown}
      />
      <MetricCard
        label="Saldo do Mês"
        value={formatCurrency(summary.balance)}
        subtext={summary.balance >= 0 ? 'Você está no positivo' : 'Gastos acima da renda'}
        variant={balanceVariant}
        icon={Wallet}
      />
      <MetricCard
        label="Maior Gasto"
        value={summary.biggestExpense ? formatCurrency(summary.biggestExpense.value) : 'Sem gastos'}
        subtext={summary.biggestExpense?.name ?? 'Nenhum lançamento neste mês'}
        icon={AlertCircle}
      />
    </div>
  );
}
