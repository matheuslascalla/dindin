import { getCategoryIcon, formatCurrency, formatPercent, cn } from '@/lib/utils';
import type { CategoryDetailBreakdown } from '@/server/actions/dashboard';

interface CategoryAnalysisCardProps {
  category: CategoryDetailBreakdown;
}

export function CategoryAnalysisCard({ category }: CategoryAnalysisCardProps) {
  const IconComponent = getCategoryIcon(category.icon);

  const { percentOfLimit } = category;

  const directPercent =
    category.totalValue > 0 ? (category.directValue / category.totalValue) * 100 : 0;

  const limitBarColor =
    category.status === 'danger'
      ? 'bg-red-500'
      : category.status === 'warning'
        ? 'bg-amber-400'
        : 'bg-teal-500';

  const hasSubcategories = category.subcategories.length > 0;
  const hasDirectValue = category.directValue > 0;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      {/* Header da categoria */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent className="h-4 w-4" style={{ color: category.color }} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{category.name}</p>
            <p className="text-xs text-slate-400">Limite: {formatPercent(category.limitPercent)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-slate-900">
            {formatCurrency(category.totalValue)}
          </p>
          <p
            className={cn(
              'text-xs font-medium',
              category.status === 'danger'
                ? 'text-red-500'
                : category.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-slate-400'
            )}
          >
            {category.percentOfIncome.toFixed(1)}% da renda
          </p>
        </div>
      </div>

      {/* Barra de limite */}
      <div className="px-6 pt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Uso do limite</span>
          <span
            className={cn(
              'text-xs font-semibold',
              category.status === 'danger'
                ? 'text-red-500'
                : category.status === 'warning'
                  ? 'text-amber-500'
                  : 'text-teal-600'
            )}
          >
            {percentOfLimit.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all', limitBarColor)}
            style={{ width: `${Math.min(percentOfLimit, 100)}%` }}
          />
        </div>
      </div>

      {/* Breakdown por sub-categorias */}
      {category.totalValue > 0 ? (
        <div className="space-y-2 px-6 py-4">
          {hasSubcategories &&
            category.subcategories.map((sub) => (
              <div key={sub.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs text-slate-600">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {sub.percentOfCategory.toFixed(1)}%
                    </span>
                    <span className="min-w-[80px] text-right text-xs font-medium text-slate-700">
                      {formatCurrency(sub.totalValue)}
                    </span>
                  </div>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${sub.percentOfCategory}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </div>
            ))}

          {hasDirectValue && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-400">Sem sub-categoria</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{directPercent.toFixed(1)}%</span>
                  <span className="min-w-[80px] text-right text-xs font-medium text-slate-400">
                    {formatCurrency(category.directValue)}
                  </span>
                </div>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-300 transition-all"
                  style={{ width: `${directPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 py-4">
          <p className="text-xs text-slate-400">Nenhum gasto neste mês.</p>
        </div>
      )}
    </div>
  );
}
