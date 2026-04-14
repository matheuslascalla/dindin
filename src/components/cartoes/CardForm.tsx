'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createCard, updateCard } from '@/server/actions/card';

interface CardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initial?: {
    id: string;
    name: string;
    brand?: string | null;
  } | null;
}

export function CardForm({ onSuccess, onCancel, initial }: CardFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    brand: initial?.brand ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const data = {
          name: form.name,
          brand: form.brand || undefined,
        };
        if (initial) {
          await updateCard(initial.id, data);
        } else {
          await createCard(data);
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
        label="Nome do cartão"
        placeholder="Ex: Bradesco"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        label="Bandeira (opcional)"
        placeholder="Ex: Visa, Mastercard"
        value={form.brand}
        onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
