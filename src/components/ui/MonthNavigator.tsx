'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface MonthNavigatorProps {
  currentMonth: Date;
  basePath: string;
}

export function MonthNavigator({ currentMonth, basePath }: MonthNavigatorProps) {
  const router = useRouter();
  const today = new Date();
  const isCurrentMonth = isSameMonth(currentMonth, today);

  const navigate = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1);
    router.push(`${basePath}?month=${newMonth.toISOString()}`);
  };

  const goToToday = () => {
    router.push(basePath);
  };

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="flex items-center gap-2">
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={goToToday}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
        >
          Hoje
        </button>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate('prev')}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="min-w-[140px] text-center text-sm font-medium capitalize text-slate-900">
          {monthLabel}
        </span>

        <button
          type="button"
          onClick={() => navigate('next')}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
