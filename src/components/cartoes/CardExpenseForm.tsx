'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { createCardExpense, updateCardExpense } from '@/server/actions/card';
import { cn, toDateInputValue } from '@/lib/utils';

type Kind = 'none' | 'monthly' | 'installment';

interface Category {
  id: string;
  name: string;
}

interface CardExpenseFormProps {
  cardId: string;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
  initial?: {
    id: string;
    name: string;
    value: number;
    date: Date;
    description?: string | null;
    person?: string | null;
    expenseTypeId: string;
    recurrence?: string | null;
    installmentGroupId?: string | null;
  } | null;
}

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'none', label: 'Avulso' },
  { value: 'monthly', label: 'Recorrente Mensal' },
  { value: 'installment', label: 'Parcelado' },
];

export function CardExpenseForm({
  cardId,
  categories,
  onSuccess,
  onCancel,
  initial,
}: CardExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialKind: Kind =
    initial?.recurrence === 'monthly'
      ? 'monthly'
      : initial?.installmentGroupId
        ? 'installment'
        : 'none';

  const [kind, setKind] = useState<Kind>(initialKind);
  const [installmentCount, setInstallmentCount] = useState(2);

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    value: initial?.value?.toString() ?? '',
    date: initial?.date ? toDateInputValue(initial.date) : toDateInputValue(),
    description: initial?.description ?? '',
    person: initial?.person ?? '',
    expenseTypeId: initial?.expenseTypeId ?? '',
  });

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const isEditing = !!initial;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(form.value);
    if (Number.isNaN(value) || value <= 0) {
      setError('Valor deve ser maior que zero.');
      return;
    }
    if (kind === 'installment' && installmentCount < 2) {
      setError('Número de parcelas deve ser pelo menos 2.');
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing) {
          await updateCardExpense(initial.id, {
            name: form.name,
            value,
            date: new Date(form.date),
            description: form.description || undefined,
            person: form.person || undefined,
            expenseTypeId: form.expenseTypeId,
          });
        } else {
          await createCardExpense({
            cardId,
            name: form.name,
            value,
            date: new Date(form.date),
            description: form.description || undefined,
            person: form.person || undefined,
            expenseTypeId: form.expenseTypeId,
            kind,
            installmentCount: kind === 'installment' ? installmentCount : undefined,
          });
        }
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo de lançamento (apenas na criação) */}
      {!isEditing && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-600">Tipo</p>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKind(opt.value)}
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                  kind === opt.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {kind === 'monthly' && (
            <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
              Este lançamento aparecerá automaticamente em todos os meses.
            </p>
          )}
          {kind === 'installment' && (
            <div className="space-y-1">
              <Input
                label="Número de parcelas"
                type="number"
                min={2}
                max={60}
                value={installmentCount}
                onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10) || 2)}
              />
              <p className="text-xs text-slate-400">
                Valor por parcela:{' '}
                {form.value
                  ? `R$ ${(parseFloat(form.value) / installmentCount).toFixed(2).replace('.', ',')}`
                  : '—'}
              </p>
            </div>
          )}
        </div>
      )}

      <Input
        label="Nome"
        placeholder="Ex: Netflix"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          type="number"
          placeholder="0,00"
          min="0.01"
          step="0.01"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />
        <Input
          label={kind === 'installment' ? 'Data da 1ª parcela' : 'Data'}
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
      </div>

      <Select
        label="Categoria"
        options={categoryOptions}
        placeholder="Selecionar categoria"
        value={form.expenseTypeId}
        onChange={(e) => setForm({ ...form, expenseTypeId: e.target.value })}
      />

      <Input
        label="Pessoa (opcional)"
        placeholder="Ex: João"
        value={form.person}
        onChange={(e) => setForm({ ...form, person: e.target.value })}
      />

      <Textarea
        label="Descrição (opcional)"
        rows={2}
        placeholder="Ex: Plano família, 4 usuários"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={isPending} className="flex-1">
          {isEditing
            ? 'Salvar'
            : kind === 'installment'
              ? `Criar ${installmentCount}x`
              : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
