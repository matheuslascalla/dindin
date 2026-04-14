'use client';

import { useState, useTransition } from 'react';
import { Pencil, Trash2, Plus, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { deleteIncome, updateIncome } from '@/server/actions/income';
import { formatCurrency, formatDate, RECURRENCE_LABEL } from '@/lib/utils';
import { IncomeForm } from './IncomeForm';

interface Income {
  id: string;
  name: string;
  value: number;
  recurrence: string;
  startDate: Date;
  active: boolean;
  createdAt: Date;
}

interface IncomeListProps {
  incomes: Income[];
  totalMonthly: number;
}

export function IncomeList({ incomes, totalMonthly }: IncomeListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteIncome(deletingId);
      setDeletingId(null);
    });
  };

  const handleToggleActive = (income: Income) => {
    startTransition(async () => {
      await updateIncome(income.id, { active: !income.active });
    });
  };

  const activeCount = incomes.filter((i) => i.active && i.recurrence === 'monthly').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Rendas</h1>
          <p className="mt-0.5 text-sm text-slate-400">Suas fontes de renda</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} />
          Nova Renda
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Total Mensal Ativo"
          value={formatCurrency(totalMonthly)}
          subtext={`${activeCount} renda(s) mensal(is) ativa(s)`}
          variant="positive"
          icon={TrendingUp}
        />
        <MetricCard
          label="Total de Fontes"
          value={`${incomes.length}`}
          subtext={`${incomes.filter((i) => i.active).length} ativa(s)`}
        />
      </div>

      {incomes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhuma renda cadastrada"
          description="Adicione suas fontes de renda para começar o controle financeiro."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              Nova Renda
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
                  Recorrência
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Início
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomes.map((income) => (
                <tr key={income.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900">{income.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(income.value)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {RECURRENCE_LABEL[income.recurrence] ?? income.recurrence}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">{formatDate(income.startDate)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(income)}
                      className="inline-flex items-center gap-1.5 text-xs transition-colors"
                    >
                      {income.active ? (
                        <CheckCircle2 size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-slate-400" />
                      )}
                      <span className={income.active ? 'text-green-600' : 'text-slate-400'}>
                        {income.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingIncome(income)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(income.id)}
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

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Renda">
        <IncomeForm
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingIncome} onClose={() => setEditingIncome(null)} title="Editar Renda">
        <IncomeForm
          initial={editingIncome}
          onSuccess={() => setEditingIncome(null)}
          onCancel={() => setEditingIncome(null)}
        />
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Confirmar exclusão">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Tem certeza que deseja deletar esta renda?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {isPending ? 'Deletando…' : 'Deletar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
