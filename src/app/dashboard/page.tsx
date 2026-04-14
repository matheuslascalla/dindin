import {
  getDashboardSummary,
  getExpensesByCategory,
  getMonthlyHistory,
  getTopExpenses,
  getExpensesByPerson,
  getCardSummary,
} from '@/server/actions/dashboard';
import type { CategoryAlert } from '@/server/actions/dashboard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { CategoryAlerts } from '@/components/dashboard/CategoryAlerts';
import { TopExpensesList } from '@/components/dashboard/TopExpensesList';
import { PersonBreakdownCard } from '@/components/dashboard/PersonBreakdownCard';
import { CardSummaryCard } from '@/components/dashboard/CardSummaryCard';
import { MonthNavigator } from '@/components/ui/MonthNavigator';

interface DashboardPageProps {
  searchParams: { month?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();

  const [summary, categoryBreakdown, monthlyHistory, topExpenses, personBreakdown, cardSummary] =
    await Promise.all([
      getDashboardSummary(currentMonth),
      getExpensesByCategory(currentMonth),
      getMonthlyHistory(6),
      getTopExpenses(currentMonth, 5),
      getExpensesByPerson(currentMonth),
      getCardSummary(currentMonth),
    ]);

  const alerts: CategoryAlert[] = categoryBreakdown
    .filter((b) => b.status !== 'ok')
    .map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      limitPercent: b.limitPercent,
      currentPercent: b.percentOfIncome,
      status: b.status as 'warning' | 'danger',
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <MonthNavigator currentMonth={currentMonth} basePath="/dashboard" />
      </div>

      {/* Summary metrics */}
      <SummaryCards summary={summary} />

      {/* Row 2: Donut + Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryDonutChart data={categoryBreakdown} />
        </div>
        <div>
          <CategoryAlerts alerts={alerts} />
        </div>
      </div>

      {/* Row 3: Monthly chart */}
      <MonthlyBarChart data={monthlyHistory} />

      {/* Row 4: Top expenses + Person + Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopExpensesList expenses={topExpenses} />
        <PersonBreakdownCard data={personBreakdown} total={summary.totalExpenses} />
        <CardSummaryCard data={cardSummary} />
      </div>
    </div>
  );
}
