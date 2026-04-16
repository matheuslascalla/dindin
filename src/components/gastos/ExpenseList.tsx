'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Plus, ShoppingCart } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { MonthNavigator } from '@/components/ui/MonthNavigator';
import { deleteExpense } from '@/server/actions/expense';
import { deleteCardExpense, deleteInstallmentGroup } from '@/server/actions/card';
import type { ContextPersons } from '@/server/actions/house';
import type { UnifiedExpense } from '@/server/actions/expense';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { PAYMENT_METHOD_CONFIG } from '@/lib/constants/payments';
import type { PaymentMethod } from '@/lib/constants/payments';
import { UnifiedExpenseForm } from './UnifiedExpenseForm';
import { ExpenseFilters } from './ExpenseFilters';
import { ExpensePagination } from './ExpensePagination';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Card {
  id: string;
  name: string;
}

interface ExpenseListProps {
  items: UnifiedExpense[];
  total: number;
  totalValue: number;
  pageCount: number;
  currentPage: number;
  categories: Category[];
  contextPersons: ContextPersons;
  cards: Card[];
  currentMonth: Date;
  currentFilters: {
    categoryId?: string;
    paymentMethod?: PaymentMethod;
    person?: string;
  };
}

type DeleteState =
  | null
  | { type: 'expense'; id: string }
  | { type: 'card-single'; id: string }
  | { type: 'card-group'; id: string; groupId: string };

function PaymentBadge({ expense }: { expense: UnifiedExpense }) {
  const method = expense.source === 'card' ? 'CARD' : (expense.paymentMethod ?? 'PIX');
  const config = PAYMENT_METHOD_CONFIG[method] ?? PAYMENT_METHOD_CONFIG.PIX;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
        config.badgeClass
      )}
    >
      <Icon size={10} />
      {expense.source === 'card' && expense.cardName ? expense.cardName : config.label}
    </div>
  );
}

export function ExpenseList({
  items,
  total,
  totalValue,
  pageCount,
  currentPage,
  categories,
  contextPersons,
  cards,
  currentMonth,
  currentFilters,
}: ExpenseListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<UnifiedExpense | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteRequest = (expense: UnifiedExpense) => {
    if (expense.source === 'expense') {
      setDeleteState({ type: 'expense', id: expense.id });
    } else if (expense.installmentGroupId) {
      setDeleteState({ type: 'card-group', id: expense.id, groupId: expense.installmentGroupId });
    } else {
      setDeleteState({ type: 'card-single', id: expense.id });
    }
  };

  const handleConfirmDelete = (deleteAll?: boolean) => {
    if (!deleteState) return;

    startTransition(async () => {
      if (deleteState.type === 'expense') {
        await deleteExpense(deleteState.id);
      } else if (deleteState.type === 'card-single') {
        await deleteCardExpense(deleteState.id);
      } else if (deleteState.type === 'card-group') {
        if (deleteAll) {
          await deleteInstallmentGroup(deleteState.groupId);
        } else {
          await deleteCardExpense(deleteState.id);
        }
      }
      setDeleteState(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gastos</h1>
          <p className="mt-0.5 text-sm text-slate-400">Todos os lançamentos do mês</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} />
          Novo Gasto
        </Button>
      </div>

      <MonthNavigator currentMonth={currentMonth} basePath="/gastos" />

      <MetricCard
        label="Total do Mês"
        value={formatCurrency(totalValue)}
        subtext={`${total} lançamento(s)`}
        variant={totalValue > 0 ? 'negative' : 'default'}
        icon={ShoppingCart}
      />

      <ExpenseFilters
        categories={categories}
        contextPersons={contextPersons}
        currentFilters={currentFilters}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhum gasto neste mês"
          description="Adicione seus gastos para controlar seus lançamentos."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              Novo Gasto
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Nome
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Meio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Pessoa
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((expense) => (
                <tr key={expense.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{expense.name}</span>
                      {expense.installmentNumber && expense.installmentTotal && (
                        <span className="ml-1.5 text-xs text-slate-400">
                          {expense.installmentNumber}/{expense.installmentTotal}x
                        </span>
                      )}
                      {expense.description && (
                        <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-red-500">
                      {formatCurrency(expense.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <CategoryBadge
                      color={expense.expenseType.color}
                      name={expense.expenseType.name}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <PaymentBadge expense={expense} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">{formatDate(expense.date)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">{expense.person ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingExpense(expense)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(expense)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpensePagination currentPage={currentPage} pageCount={pageCount} />

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Gasto">
        <UnifiedExpenseForm
          categories={categories}
          contextPersons={contextPersons}
          cards={cards}
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} title="Editar Gasto">
        <UnifiedExpenseForm
          categories={categories}
          contextPersons={contextPersons}
          cards={cards}
          initial={editingExpense}
          onSuccess={() => setEditingExpense(null)}
          onCancel={() => setEditingExpense(null)}
        />
      </Modal>

      <Modal
        isOpen={
          !!deleteState && (deleteState.type === 'expense' || deleteState.type === 'card-single')
        }
        onClose={() => setDeleteState(null)}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Tem certeza que deseja deletar este gasto?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteState(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() => handleConfirmDelete()}
              className="flex-1"
            >
              {isPending ? 'Deletando…' : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteState && deleteState.type === 'card-group'}
        onClose={() => setDeleteState(null)}
        title="Deletar parcelamento"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Este gasto faz parte de um parcelamento. O que deseja deletar?
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={() => handleConfirmDelete(false)}
            >
              {isPending ? 'Deletando…' : 'Só esta parcela'}
            </Button>
            <Button variant="danger" disabled={isPending} onClick={() => handleConfirmDelete(true)}>
              {isPending ? 'Deletando…' : 'Todas as parcelas'}
            </Button>
            <Button variant="secondary" onClick={() => setDeleteState(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
