'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ContentCard } from '@/components/ui/ContentCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { CategoryBreakdown } from '@/server/actions/dashboard';
import { NameType } from 'recharts/types/component/DefaultTooltipContent';

interface CategoryDonutChartProps {
  data: CategoryBreakdown[];
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const chartData = data.filter((d) => d.totalValue > 0);

  return (
    <ContentCard title="Gastos por Categoria">
      {chartData.length > 0 ? (
        <div className="space-y-4">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="totalValue"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    color: '#0F172A',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                  }}
                  formatter={(value: number, name: NameType) => [formatCurrency(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-xs text-slate-600">{cat.name}</span>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-2 text-right">
                    <span className="text-xs text-slate-400">
                      {formatPercent(cat.percentOfIncome)} / {formatPercent(cat.limitPercent)}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCurrency(cat.totalValue)}
                    </span>
                  </div>
                </div>
                <ProgressBar
                  percent={
                    cat.limitPercent > 0 ? (cat.percentOfIncome / cat.limitPercent) * 100 : 0
                  }
                  status={cat.status}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-slate-400">Sem gastos neste mês</p>
        </div>
      )}
    </ContentCard>
  );
}
