'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ContentCard } from '@/components/ui/ContentCard';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyHistory } from '@/server/actions/dashboard';

interface MonthlyBarChartProps {
  data: MonthlyHistory[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <ContentCard title="Histórico dos Últimos 6 Meses">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="capitalize"
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                color: '#0F172A',
                fontSize: '12px',
                boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'income' ? 'Renda' : 'Gastos',
              ]}
              cursor={{ fill: '#F1F5F9', opacity: 0.8 }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" />
            <Bar dataKey="expenses" fill="#6366f1" radius={[4, 4, 0, 0]} name="expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span className="text-xs text-slate-500">Renda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          <span className="text-xs text-slate-500">Gastos</span>
        </div>
      </div>
    </ContentCard>
  );
}
