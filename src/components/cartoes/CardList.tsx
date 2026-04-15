'use client';

import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricCard } from '@/components/ui/MetricCard';
import { MonthNavigator } from '@/components/ui/MonthNavigator';
import type { ContextPersons } from '@/server/actions/house';
import { formatCurrency } from '@/lib/utils';
import { CardItem } from './CardItem';
import { CardForm } from './CardForm';

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

interface Card {
  id: string;
  name: string;
  brand?: string | null;
  _count: { expenses: number };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CardListProps {
  cards: Card[];
  expensesByCard: Record<string, CardExpense[]>;
  totalsByCard: Record<string, number>;
  grandTotal: number;
  categories: Category[];
  contextPersons: ContextPersons;
  currentMonth: Date;
}

export function CardList({
  cards,
  expensesByCard,
  totalsByCard,
  grandTotal,
  categories,
  contextPersons,
  currentMonth,
}: CardListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cartões</h1>
          <p className="mt-0.5 text-sm text-slate-400">Lançamentos por cartão de crédito</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} />
          Novo Cartão
        </Button>
      </div>

      <MonthNavigator currentMonth={currentMonth} basePath="/cartoes" />

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Total Cartões no Mês"
          value={formatCurrency(grandTotal)}
          subtext={`${cards.length} cartão(ões) cadastrado(s)`}
          variant={grandTotal > 0 ? 'negative' : 'default'}
          icon={CreditCard}
        />
        <MetricCard
          label="Cartões"
          value={`${cards.length}`}
          subtext={`${Object.values(expensesByCard).flat().length} lançamento(s) no mês`}
        />
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Adicione seus cartões de crédito para controlar os lançamentos."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={14} />
              Novo Cartão
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              expenses={expensesByCard[card.id] ?? []}
              categories={categories}
              contextPersons={contextPersons}
              monthTotal={totalsByCard[card.id] ?? 0}
              onEditCard={() => setEditingCard(card)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Cartão">
        <CardForm
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!editingCard} onClose={() => setEditingCard(null)} title="Editar Cartão">
        <CardForm
          initial={editingCard}
          onSuccess={() => setEditingCard(null)}
          onCancel={() => setEditingCard(null)}
        />
      </Modal>
    </div>
  );
}
