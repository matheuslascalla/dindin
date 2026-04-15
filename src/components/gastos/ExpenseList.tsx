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
import type { ContextPersons } from '@/server/actions/house';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseForm } from './ExpenseForm';

interface Expense {
  id: string;
  name: string;
  value: number;
  date: Date;
  description?: string | null;
  person?: string | null;
  expenseTypeId: string;
  expenseType: { id: string; name: string; color: string };
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  contextPersons: ContextPersons;
  currentMonth: Date;
  total: number;
}

export function ExpenseList({
  expenses,
  categories,
  contextPersons,
  currentMonth,
  total,
}: ExpenseListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteExpense(deletingId);
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gastos</h1>
          <p className="mt-0.5 text-sm text-slate-400">Lançamentos avulsos (sem cartão)</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} />
          Novo Gasto
        </Button>
      </div>

      <MonthNavigator currentMonth={currentMonth} basePath="/gastos" />

      <MetricCard
        label="Total do Mês"
        value={formatCurrency(total)}
        subtext={`${expenses.length} lançamento(s)`}
        variant={total > 0 ? 'negative' : 'default'}
        icon={ShoppingCart}
      />

      {expenses.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhum gasto neste mês"
          description="Adicione seus gastos avulsos para controlar seus lançamentos."
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
              {expenses.map((expense) => (
                <tr key={expense.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{expense.name}</span>
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
                        onClick={() => setDeletingId(expense.id)}
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

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Gasto">
        <ExpenseForm
          categories={categories}
          contextPersons={contextPersons}
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} title="Editar Gasto">
        <ExpenseForm
          categories={categories}
          contextPersons={contextPersons}
          initial={editingExpense}
          onSuccess={() => setEditingExpense(null)}
          onCancel={() => setEditingExpense(null)}
        />
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Confirmar exclusão">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Tem certeza que deseja deletar este gasto?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" disabled={isPending} onClick={handleDelete} className="flex-1">
              {isPending ? 'Deletando…' : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
