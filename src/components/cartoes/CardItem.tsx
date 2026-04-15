'use client';

import { useState, useTransition } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { deleteCard, deleteCardExpense, deleteInstallmentGroup } from '@/server/actions/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CardExpenseForm } from './CardExpenseForm';

interface CardExpense {
  id: string;
  name: string;
  value: number;
  date: Date;
  description?: string | null;
  person?: string | null;
  expenseTypeId: string;
  expenseType: { id: string; name: string; color: string };
  recurrence: string;
  installmentTotal?: number | null;
  installmentNumber?: number | null;
  installmentGroupId?: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CardItemProps {
  card: {
    id: string;
    name: string;
    brand?: string | null;
    _count: { expenses: number };
  };
  expenses: CardExpense[];
  categories: Category[];
  monthTotal: number;
  onEditCard: () => void;
}

export function CardItem({ card, expenses, categories, monthTotal, onEditCard }: CardItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CardExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<CardExpense | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteCard = () => {
    startTransition(async () => {
      await deleteCard(card.id);
      setIsDeletingCard(false);
    });
  };

  const handleDeleteSingle = () => {
    if (!deletingExpense) return;
    startTransition(async () => {
      await deleteCardExpense(deletingExpense.id);
      setDeletingExpense(null);
    });
  };

  const handleDeleteGroup = () => {
    const groupId = deletingExpense?.installmentGroupId;
    if (!groupId) return;
    startTransition(async () => {
      await deleteInstallmentGroup(groupId);
      setDeletingExpense(null);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="flex items-center gap-4 px-6 py-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <CreditCard size={16} className="text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{card.name}</span>
              {card.brand && (
                <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {card.brand}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {expenses.length} lançamento(s) neste mês
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(monthTotal)}</p>
            <p className="mt-0.5 text-xs text-slate-400">no mês</p>
          </div>
          <span className="ml-2 text-slate-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="gap-1">
            <Plus size={12} />
            Lançamento
          </Button>
          <button
            type="button"
            onClick={onEditCard}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsDeletingCard(true)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100">
          {expenses.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">Nenhum lançamento neste mês.</p>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="mt-2 text-sm text-teal-600 hover:underline"
              >
                + Adicionar lançamento
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Nome
                  </th>
                  <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Valor
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Categoria
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Data
                  </th>
                  <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    Pessoa
                  </th>
                  <th className="px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-slate-900">{exp.name}</span>
                        {exp.recurrence === 'monthly' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-xs text-teal-700">
                            <RefreshCw size={10} />
                            Mensal
                          </span>
                        )}
                        {exp.installmentTotal && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            {exp.installmentNumber}/{exp.installmentTotal}
                          </span>
                        )}
                        {exp.description && (
                          <span className="max-w-[120px] truncate text-xs italic text-slate-400">
                            {exp.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-medium text-red-500">
                        {formatCurrency(exp.value)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <CategoryBadge color={exp.expenseType.color} name={exp.expenseType.name} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-400">
                        {exp.recurrence === 'monthly' ? '—' : formatDate(exp.date)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-slate-400">{exp.person ?? '—'}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingExpense(exp)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExpense(exp)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Novo Lançamento"
      >
        <CardExpenseForm
          cardId={card.id}
          categories={categories}
          onSuccess={() => setIsAddExpenseOpen(false)}
          onCancel={() => setIsAddExpenseOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Editar Lançamento"
      >
        <CardExpenseForm
          cardId={card.id}
          categories={categories}
          initial={editingExpense}
          onSuccess={() => setEditingExpense(null)}
          onCancel={() => setEditingExpense(null)}
        />
      </Modal>

      {/* Delete expense modal — diferenciado para parcelados */}
      <Modal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        title="Confirmar exclusão"
      >
        <div className="space-y-4">
          {deletingExpense?.installmentGroupId ? (
            <>
              <p className="text-sm text-slate-500">
                Este lançamento é a parcela{' '}
                <strong className="text-slate-900">
                  {deletingExpense.installmentNumber}/{deletingExpense.installmentTotal}
                </strong>{' '}
                de <strong className="text-slate-900">{deletingExpense.name}</strong>. O que deseja
                fazer?
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={handleDeleteSingle}
                  className="w-full"
                >
                  Deletar apenas esta parcela
                </Button>
                <Button
                  variant="danger"
                  disabled={isPending}
                  onClick={handleDeleteGroup}
                  className="w-full"
                >
                  {isPending ? 'Deletando…' : 'Deletar todas as parcelas'}
                </Button>
                <Button variant="secondary" onClick={() => setDeletingExpense(null)}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                {deletingExpense?.recurrence === 'monthly'
                  ? `Tem certeza que deseja remover o lançamento recorrente "${deletingExpense?.name}"? Ele deixará de aparecer em todos os meses.`
                  : 'Tem certeza que deseja deletar este lançamento?'}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeletingExpense(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  disabled={isPending}
                  onClick={handleDeleteSingle}
                  className="flex-1"
                >
                  {isPending ? 'Deletando…' : 'Deletar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDeletingCard}
        onClose={() => setIsDeletingCard(false)}
        title="Deletar cartão"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Tem certeza que deseja deletar o cartão{' '}
            <strong className="text-slate-900">{card.name}</strong>? Todos os lançamentos vinculados
            também serão removidos.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeletingCard(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={isPending}
              onClick={handleDeleteCard}
              className="flex-1"
            >
              {isPending ? 'Deletando…' : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
