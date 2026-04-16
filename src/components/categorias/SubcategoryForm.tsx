'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSubcategory, updateSubcategory } from '@/server/actions/subcategory';

interface SubcategoryFormProps {
  expenseTypeId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initial?: { id: string; name: string } | null;
}

export function SubcategoryForm({
  expenseTypeId,
  onSuccess,
  onCancel,
  initial,
}: SubcategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (initial) {
          await updateSubcategory(initial.id, { name });
        } else {
          await createSubcategory({ name, expenseTypeId });
        }
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar sub-categoria.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        placeholder="Ex: Delivery"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
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
