import { Suspense } from 'react';
import { BarChart2 } from 'lucide-react';

import {
  getExpensesByCategoryWithSubcategories,
  getDashboardSummary,
} from '@/server/actions/dashboard';
import { MonthNavigator } from '@/components/ui/MonthNavigator';
import { CategoryAnalysisCard } from '@/components/analise/CategoryAnalysisCard';
import { formatCurrency } from '@/lib/utils';

interface AnalisePageProps {
  searchParams: { month?: string };
}

async function AnaliseContent({ month }: { month: Date }) {
  const [categories, summary] = await Promise.all([
    getExpensesByCategoryWithSubcategories(month),
    getDashboardSummary(month),
  ]);

  const withExpenses = categories.filter((c) => c.totalValue > 0);
  const withoutExpenses = categories.filter((c) => c.totalValue === 0);

  return (
    <>
      {/* Totalizador */}
      <div className="flex items-center gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-card">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total gasto</p>
          <p className="mt-0.5 text-xl font-bold text-red-500">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Renda total</p>
          <p className="mt-0.5 text-xl font-bold text-teal-600">
            {formatCurrency(summary.monthlyIncome + summary.eventualIncome + summary.weeklyIncome)}
          </p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Categorias ativas
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">{withExpenses.length}</p>
        </div>
      </div>

      {/* Categorias com gastos */}
      {withExpenses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {withExpenses.map((cat) => (
            <CategoryAnalysisCard key={cat.id} category={cat} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <BarChart2 size={32} className="mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Nenhum gasto neste mês</p>
          <p className="mt-1 text-xs text-slate-400">
            Adicione gastos para visualizar a análise por categoria.
          </p>
        </div>
      )}

      {/* Categorias sem gastos */}
      {withoutExpenses.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Sem gastos neste mês
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {withoutExpenses.map((cat) => (
              <CategoryAnalysisCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default async function AnalisePage({ searchParams }: AnalisePageProps) {
  const currentMonth = searchParams.month ? new Date(searchParams.month) : new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Análise por Categoria</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Distribuição dos gastos por categoria e sub-categoria
          </p>
        </div>
      </div>

      <MonthNavigator currentMonth={currentMonth} basePath="/analise" />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        }
      >
        <AnaliseContent month={currentMonth} />
      </Suspense>
    </div>
  );
}
