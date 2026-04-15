'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createCategory, updateCategory } from '@/server/actions/category';
import { getCategoryIcon } from '@/lib/utils';

const AVAILABLE_ICONS = [
  'home',
  'target',
  'sofa',
  'heart',
  'trending-up',
  'book-open',
  'shopping-bag',
  'car',
  'utensils',
  'plane',
  'activity',
  'music',
  'coffee',
  'film',
  'globe',
  'star',
  'zap',
  'gift',
  'shield',
  'sun',
];

interface CategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initial?: {
    id: string;
    name: string;
    limitPercent: number;
    color: string;
    icon: string;
  } | null;
}

export function CategoryForm({ onSuccess, onCancel, initial }: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    limitPercent: initial?.limitPercent?.toString() ?? '',
    color: initial?.color ?? '#0D9488',
    icon: initial?.icon ?? 'home',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limitPercent = parseFloat(form.limitPercent);
    if (Number.isNaN(limitPercent) || limitPercent < 0.1 || limitPercent > 100) {
      setError('Limite deve ser entre 0.1 e 100.');
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          name: form.name,
          limitPercent,
          color: form.color,
          icon: form.icon,
        };
        if (initial) {
          await updateCategory(initial.id, data);
        } else {
          await createCategory(data);
        }
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar categoria.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        placeholder="Ex: CUSTO FIXO"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <Input
        label="Limite ideal (%)"
        type="number"
        placeholder="Ex: 40"
        min="0.1"
        max="100"
        step="0.1"
        value={form.limitPercent}
        onChange={(e) => setForm({ ...form, limitPercent: e.target.value })}
        required
      />

      <div className="space-y-1">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="block text-sm font-medium text-slate-600">Cor</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-10 w-10 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
          />
          <span className="font-mono text-sm text-slate-500">{form.color.toUpperCase()}</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="block text-sm font-medium text-slate-600">Ícone</label>
        <div className="grid grid-cols-5 gap-1.5">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComponent = getCategoryIcon(icon);
            const isSelected = form.icon === icon;
            return (
              <button
                key={icon}
                type="button"
                title={icon}
                onClick={() => setForm({ ...form, icon })}
                className={`flex items-center justify-center rounded-lg p-2.5 transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
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
