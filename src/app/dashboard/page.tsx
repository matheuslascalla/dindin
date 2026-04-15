import { Suspense, cache } from 'react';

import {
  getDashboardSummary as _getDashboardSummary,
  getExpensesByCategory as _getExpensesByCategory,
  getMonthlyHistory,
  getTopExpenses,
  getExpensesByPerson,
  getCardSummary,
  shouldShowPersonBreakdown,
} from '@/server/actions/dashboard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart';
import { CategoryAlerts } from '@/components/dashboard/CategoryAlerts';
import { TopExpensesList } from '@/components/dashboard/TopExpensesList';
import { PersonBreakdownCard } from '@/components/dashboard/PersonBreakdownCard';
import { CardSummaryCard } from '@/components/dashboard/CardSummaryCard';
import { MonthNavigator } from '@/components/ui/MonthNavigator';
import { cn } from '@/lib/utils';
import {
  SummaryCardsSkeleton,
  CategorySectionSkeleton,
  HistorySectionSkeleton,
  BottomSectionSkeleton,
} from '@/components/dashboard/DashboardSkeletons';

// Per-request memoization: duplicate calls with the same args return the cached result
// getDashboardSummary is called in both SummarySection and BottomSection
const getDashboardSummary = cache(_getDashboardSummary);
const getExpensesByCategory = cache(_getExpensesByCategory);

interface DashboardPageProps {
  searchParams: { month?: string };
}

// ─── Async sub-components (each fetches its own data) ───────────────────────

async function SummarySection({ month }: { month: Date }) {
  const summary = await getDashboardSummary(month);
  return <SummaryCards summary={summary} />;
}

async function CategorySection({ month }: { month: Date }) {
  const breakdown = await getExpensesByCategory(month);

  const alerts = breakdown
    .filter((b) => b.status !== 'ok')
    .map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      icon: b.icon,
      limitPercent: b.limitPercent,
      currentPercent: b.percentOfIncome,
      status: b.status as 'warning' | 'danger',
    }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CategoryDonutChart data={breakdown} />
      </div>
      <div>
        <CategoryAlerts alerts={alerts} />
      </div>
    </div>
  );
}

async function HistorySection() {
  const history = await getMonthlyHistory(6);
  return <MonthlyBarChart data={history} />;
}

async function BottomSection({
  month,
  showPersonBreakdown,
}: {
  month: Date;
  showPersonBreakdown: boolean;
}) {
  const [topExpenses, personBreakdown, cardSummary, summary] = await Promise.all([
    getTopExpenses(month, 5),
    showPersonBreakdown ? getExpensesByPerson(month) : Promise.resolve([]),
    getCardSummary(month),
    getDashboardSummary(month),
  ]);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        showPersonBreakdown ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
      )}
    >
      <TopExpensesList expenses={topExpenses} />
      {showPersonBreakdown && (
        <PersonBreakdownCard data={personBreakdown} total={summary.totalExpenses} />
      )}
      <CardSummaryCard data={cardSummary} />
    </div>
  );
}

// ─── Page shell — renders immediately, data streams in ───────────────────────

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();
  const showPersonBreakdown = await shouldShowPersonBreakdown();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <MonthNavigator currentMonth={currentMonth} basePath="/dashboard" />
      </div>

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummarySection month={currentMonth} />
      </Suspense>

      <Suspense fallback={<CategorySectionSkeleton />}>
        <CategorySection month={currentMonth} />
      </Suspense>

      <Suspense fallback={<HistorySectionSkeleton />}>
        <HistorySection />
      </Suspense>

      <Suspense fallback={<BottomSectionSkeleton cols={showPersonBreakdown ? 3 : 2} />}>
        <BottomSection month={currentMonth} showPersonBreakdown={showPersonBreakdown} />
      </Suspense>
    </div>
  );
}
