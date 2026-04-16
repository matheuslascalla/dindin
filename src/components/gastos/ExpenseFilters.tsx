'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/constants/payments';
import type { PaymentMethod } from '@/lib/constants/payments';
import type { ContextPersons } from '@/server/actions/house';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseFiltersProps {
  categories: Category[];
  contextPersons: ContextPersons;
  currentFilters: {
    categoryId?: string;
    paymentMethod?: PaymentMethod;
    person?: string;
  };
}

export function ExpenseFilters({
  categories,
  contextPersons,
  currentFilters,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasActiveFilters = !!(
    currentFilters.categoryId ||
    currentFilters.paymentMethod ||
    currentFilters.person
  );

  const [isOpen, setIsOpen] = useState(hasActiveFilters);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoryId');
    params.delete('paymentMethod');
    params.delete('person');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const personOptions =
    contextPersons.type === 'house'
      ? contextPersons.members.map((m) => ({ value: m.name ?? m.id, label: m.name ?? m.id }))
      : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            isOpen
              ? 'bg-teal-50 text-teal-700'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          )}
        >
          <Filter size={12} />
          Filtros
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white">
              {
                [
                  currentFilters.categoryId,
                  currentFilters.paymentMethod,
                  currentFilters.person,
                ].filter(Boolean).length
              }
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            <X size={11} />
            Limpar filtros
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Meio de pagamento</p>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => updateFilter('paymentMethod', '')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  !currentFilters.paymentMethod
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Todos
              </button>
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      'paymentMethod',
                      currentFilters.paymentMethod === opt.value ? '' : opt.value
                    )
                  }
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-all',
                    currentFilters.paymentMethod === opt.value
                      ? opt.activeClass
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[180px] space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Categoria</p>
            <Select
              options={[{ value: '__all__', label: 'Todas' }, ...categoryOptions]}
              value={currentFilters.categoryId ?? '__all__'}
              onChange={(e) =>
                updateFilter('categoryId', e.target.value === '__all__' ? '' : e.target.value)
              }
            />
          </div>

          {contextPersons.type === 'house' && personOptions.length > 0 && (
            <div className="min-w-[160px] space-y-1.5">
              <p className="text-xs font-medium text-slate-500">Pessoa</p>
              <Select
                options={[{ value: '__all__', label: 'Todas' }, ...personOptions]}
                value={currentFilters.person ?? '__all__'}
                onChange={(e) =>
                  updateFilter('person', e.target.value === '__all__' ? '' : e.target.value)
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
