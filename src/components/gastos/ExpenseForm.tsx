'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { createExpense, updateExpense } from '@/server/actions/expense';
import { toDateInputValue } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseFormProps {
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
  } | null;
}

export function ExpenseForm({ categories, onSuccess, onCancel, initial }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    value: initial?.value?.toString() ?? '',
    date: initial?.date ? toDateInputValue(initial.date) : toDateInputValue(),
    description: initial?.description ?? '',
    person: initial?.person ?? '',
    expenseTypeId: initial?.expenseTypeId ?? '',
  });

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(form.value);
    if (Number.isNaN(value) || value <= 0) {
      setError('Valor deve ser maior que zero.');
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          name: form.name,
          value,
          date: new Date(form.date),
          description: form.description || undefined,
          person: form.person || undefined,
          expenseTypeId: form.expenseTypeId,
        };
        if (initial) {
          await updateExpense(initial.id, data);
        } else {
          await createExpense(data);
        }
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        placeholder="Ex: Conta de luz"
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
          label="Data"
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
        required
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
        placeholder="Observações..."
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
          {initial ? 'Salvar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
