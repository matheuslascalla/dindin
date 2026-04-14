'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { createIncome, updateIncome } from '@/server/actions/income';
import { toDateInputValue } from '@/lib/utils';

const RECURRENCE_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'eventual', label: 'Eventual' },
];

interface IncomeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initial?: {
    id: string;
    name: string;
    value: number;
    recurrence: string;
    startDate: Date;
    active: boolean;
  } | null;
}

export function IncomeForm({ onSuccess, onCancel, initial }: IncomeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    value: initial?.value?.toString() ?? '',
    recurrence: initial?.recurrence ?? 'monthly',
    startDate: initial?.startDate ? toDateInputValue(initial.startDate) : toDateInputValue(),
    active: initial?.active ?? true,
  });

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
          recurrence: form.recurrence as 'monthly' | 'weekly' | 'eventual',
          startDate: new Date(form.startDate),
          active: form.active,
        };
        if (initial) {
          await updateIncome(initial.id, data);
        } else {
          await createIncome(data);
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
        placeholder="Ex: Salário CLT"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

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

      <Select
        label="Recorrência"
        options={RECURRENCE_OPTIONS}
        value={form.recurrence}
        onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
      />

      <Input
        label="Data de início"
        type="date"
        value={form.startDate}
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        required
      />

      <div className="flex items-center gap-3">
        <Switch
          checked={form.active}
          onCheckedChange={(checked) => setForm({ ...form, active: checked })}
        />
        <span className="text-sm text-slate-600">{form.active ? 'Ativa' : 'Inativa'}</span>
      </div>

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
