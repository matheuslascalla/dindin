'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ExpensePaginationProps {
  currentPage: number;
  pageCount: number;
}

export function ExpensePagination({ currentPage, pageCount }: ExpensePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < pageCount;

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => goToPage(currentPage - 1)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          canPrev ? 'text-slate-600 hover:bg-slate-100' : 'cursor-not-allowed text-slate-300'
        )}
      >
        <ChevronLeft size={14} />
        Anterior
      </button>

      <span className="text-sm text-slate-500">
        Página <span className="font-medium text-slate-900">{currentPage}</span> de{' '}
        <span className="font-medium text-slate-900">{pageCount}</span>
      </span>

      <button
        type="button"
        disabled={!canNext}
        onClick={() => goToPage(currentPage + 1)}
        className={cn(
          'flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          canNext ? 'text-slate-600 hover:bg-slate-100' : 'cursor-not-allowed text-slate-300'
        )}
      >
        Próxima
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
