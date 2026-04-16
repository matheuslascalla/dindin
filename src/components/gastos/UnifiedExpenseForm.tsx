'use client';

import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PersonToggle } from '@/components/ui/PersonToggle';
import { createExpense, updateExpense } from '@/server/actions/expense';
import { createCardExpense, updateCardExpense } from '@/server/actions/card';
import type { ContextPersons } from '@/server/actions/house';
import type { UnifiedExpense } from '@/server/actions/expense';
import { cn, toDateInputValue, resolvePersonFromContext } from '@/lib/utils';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/constants/payments';
import type { PaymentMethod } from '@/lib/constants/payments';
import type { Subcategory } from '@/types';

type Kind = 'none' | 'monthly' | 'installment';

interface Category {
  id: string;
  name: string;
  color: string;
  subcategories: Subcategory[];
}

interface Card {
  id: string;
  name: string;
}

interface UnifiedExpenseFormProps {
  categories: Category[];
  contextPersons: ContextPersons;
  cards: Card[];
  onSuccess: () => void;
  onCancel: () => void;
  initial?: UnifiedExpense | null;
}

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'none', label: 'Avulso' },
  { value: 'monthly', label: 'Recorrente Mensal' },
  { value: 'installment', label: 'Parcelado' },
];

function resolveInitialPaymentMethod(initial?: UnifiedExpense | null): PaymentMethod {
  if (!initial) return 'PIX';
  if (initial.source === 'card') return 'CARD';
  return (initial.paymentMethod as PaymentMethod) ?? 'PIX';
}

export function UnifiedExpenseForm({
  categories,
  contextPersons,
  cards,
  onSuccess,
  onCancel,
  initial,
}: UnifiedExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initial;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    resolveInitialPaymentMethod(initial)
  );

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
    expenseTypeId: initial?.expenseType?.id ?? '',
    subcategoryId: initial?.subcategoryId ?? '',
    cardId: initial?.cardId ?? cards[0]?.id ?? '',
  });

  const selectedCategory = categories.find((c) => c.id === form.expenseTypeId) ?? null;
  const availableSubcategories = selectedCategory?.subcategories ?? [];

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const subcategoryOptions = availableSubcategories.map((s) => ({ value: s.id, label: s.name }));
  const cardOptions = cards.map((c) => ({ value: c.id, label: c.name }));

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    if (isEditing) return;
    setPaymentMethod(method);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(form.value);
    if (Number.isNaN(value) || value <= 0) {
      setError('Valor deve ser maior que zero.');
      return;
    }

    if (paymentMethod === 'CARD') {
      if (!form.cardId) {
        setError('Selecione um cartão.');
        return;
      }
      if (kind === 'installment' && installmentCount < 2) {
        setError('Número de parcelas deve ser pelo menos 2.');
        return;
      }
    }

    startTransition(async () => {
      try {
        const person = resolvePersonFromContext(contextPersons, form.person);

        const subcategoryId = form.subcategoryId || undefined;

        if (paymentMethod === 'CARD') {
          if (isEditing && initial?.source === 'card') {
            await updateCardExpense(initial.id, {
              name: form.name,
              value,
              date: new Date(form.date),
              description: form.description || undefined,
              person,
              expenseTypeId: form.expenseTypeId,
              subcategoryId,
            });
          } else {
            await createCardExpense({
              cardId: form.cardId,
              name: form.name,
              value,
              date: new Date(form.date),
              description: form.description || undefined,
              person,
              expenseTypeId: form.expenseTypeId,
              subcategoryId,
              kind,
              installmentCount: kind === 'installment' ? installmentCount : undefined,
            });
          }
        } else {
          const data = {
            name: form.name,
            value,
            date: new Date(form.date),
            description: form.description || undefined,
            person,
            expenseTypeId: form.expenseTypeId,
            subcategoryId,
            paymentMethod,
          };

          if (isEditing && initial?.source === 'expense') {
            await updateExpense(initial.id, data);
          } else {
            await createExpense(data);
          }
        }

        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-600">Meio de pagamento</p>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {PAYMENT_METHOD_OPTIONS.map(({ value, label, icon: Icon, activeClass }) => {
            const isCardWithNoCards = value === 'CARD' && cards.length === 0 && !isEditing;
            const isDisabled = isEditing || isCardWithNoCards;
            const isActive = paymentMethod === value;

            return (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                onClick={() => handlePaymentMethodChange(value)}
                title={isCardWithNoCards ? 'Cadastre um cartão primeiro' : undefined}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                  isActive ? activeClass : 'text-slate-500 hover:text-slate-700',
                  isDisabled && 'cursor-not-allowed opacity-40'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>
        {cards.length === 0 && !isEditing && (
          <p className="text-xs text-slate-400">
            Para lançar no cartão, cadastre um cartão na página de Cartões.
          </p>
        )}
      </div>

      {paymentMethod === 'CARD' && (
        <Select
          label="Cartão"
          options={cardOptions}
          placeholder="Selecionar cartão"
          value={form.cardId}
          onChange={(e) => setForm({ ...form, cardId: e.target.value })}
          required
        />
      )}

      {paymentMethod === 'CARD' && !isEditing && (
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
                    ? 'bg-teal-50 font-semibold text-teal-700'
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
          label={paymentMethod === 'CARD' && kind === 'installment' ? 'Data da 1ª parcela' : 'Data'}
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
        onChange={(e) => setForm({ ...form, expenseTypeId: e.target.value, subcategoryId: '' })}
        required
      />

      {availableSubcategories.length > 0 && (
        <Select
          label="Sub-categoria (opcional)"
          options={subcategoryOptions}
          placeholder="Selecionar sub-categoria"
          value={form.subcategoryId}
          onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
        />
      )}

      {contextPersons.type === 'house' && (
        <PersonToggle
          label="Pessoa (opcional)"
          persons={contextPersons.members.map((m) => ({ name: m.name ?? m.id, image: m.image }))}
          value={form.person || null}
          onChange={(name) => setForm({ ...form, person: name ?? '' })}
        />
      )}

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
          {isEditing
            ? 'Salvar'
            : paymentMethod === 'CARD' && kind === 'installment'
              ? `Criar ${installmentCount}x`
              : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
