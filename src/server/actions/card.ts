'use server';

import { revalidatePath } from 'next/cache';
import { addMonths } from 'date-fns';
import { randomUUID } from 'crypto';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import {
  CreateCardSchema,
  UpdateCardSchema,
  CreateCardExpenseSchema,
  UpdateCardExpenseSchema,
} from '@/lib/validators/card';
import type {
  CreateCardInput,
  UpdateCardInput,
  CreateCardExpenseInput,
  UpdateCardExpenseInput,
} from '@/lib/validators/card';
import { utcStartOfMonth, utcEndOfMonth, cardExpenseMonthFilter } from '@/lib/utils';

function monthFilter(month: Date) {
  return cardExpenseMonthFilter(utcStartOfMonth(month), utcEndOfMonth(month));
}

export async function createCard(data: CreateCardInput) {
  const validated = CreateCardSchema.parse(data);
  const filter = await getContextFilter();

  const card = await prisma.creditCard.create({ data: { ...validated, ...filter } });
  revalidatePath('/cartoes');
  return card;
}

export async function updateCard(id: string, data: UpdateCardInput) {
  const validated = UpdateCardSchema.parse(data);
  const filter = await getContextFilter();

  const card = await prisma.creditCard.update({ where: { id, ...filter }, data: validated });
  revalidatePath('/cartoes');
  return card;
}

export async function deleteCard(id: string) {
  const filter = await getContextFilter();
  await prisma.creditCard.delete({ where: { id, ...filter } });
  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
}

export async function listCards() {
  const filter = await getContextFilter();

  return prisma.creditCard.findMany({
    where: filter,
    include: { _count: { select: { expenses: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCardExpense(data: CreateCardExpenseInput) {
  const validated = CreateCardExpenseSchema.parse(data);
  const filter = await getContextFilter();
  const { kind, installmentCount, cardId, name, date, description, person, value, expenseTypeId } =
    validated;

  // Verify the card belongs to the user's context before creating expenses on it
  const card = await prisma.creditCard.findFirst({ where: { id: cardId, ...filter } });
  if (!card) throw new Error('Cartão não encontrado.');

  if (kind === 'installment') {
    const groupId = randomUUID();
    await prisma.cardExpense.createMany({
      data: Array.from({ length: installmentCount! }, (_, i) => ({
        cardId,
        name,
        value,
        date: addMonths(date, i),
        description: description || null,
        person: person || null,
        expenseTypeId,
        recurrence: 'none',
        installmentTotal: installmentCount,
        installmentNumber: i + 1,
        installmentGroupId: groupId,
      })),
    });
  } else {
    await prisma.cardExpense.create({
      data: {
        cardId,
        name,
        value,
        date,
        description: description || null,
        person: person || null,
        expenseTypeId,
        recurrence: kind,
      },
    });
  }

  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
}

export async function updateCardExpense(id: string, data: UpdateCardExpenseInput) {
  const validated = UpdateCardExpenseSchema.parse(data);
  const filter = await getContextFilter();

  // Verify ownership before updating
  const existing = await prisma.cardExpense.findFirst({ where: { id, card: filter } });
  if (!existing) throw new Error('Gasto não encontrado.');

  const expense = await prisma.cardExpense.update({
    where: { id },
    data: validated,
    include: { expenseType: true, card: true },
  });
  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
  return expense;
}

export async function deleteCardExpense(id: string) {
  const filter = await getContextFilter();

  const { count } = await prisma.cardExpense.deleteMany({ where: { id, card: filter } });
  if (count === 0) throw new Error('Gasto não encontrado.');

  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
}

export async function deleteInstallmentGroup(groupId: string) {
  const filter = await getContextFilter();
  await prisma.cardExpense.deleteMany({ where: { installmentGroupId: groupId, card: filter } });
  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
}

export async function listCardExpenses(cardId: string, month?: Date) {
  const filter = await getContextFilter();
  const cardMonthFilter = month ? monthFilter(month) : {};

  return prisma.cardExpense.findMany({
    where: { cardId, card: filter, ...cardMonthFilter },
    include: { expenseType: true },
    orderBy: { date: 'desc' },
  });
}

export async function getCardTotal(cardId: string, month: Date): Promise<number> {
  const filter = await getContextFilter();

  const result = await prisma.cardExpense.aggregate({
    _sum: { value: true },
    where: { cardId, card: filter, ...monthFilter(month) },
  });
  return result._sum.value ?? 0;
}

export async function getAllCardsTotal(month: Date): Promise<number> {
  const filter = await getContextFilter();

  const result = await prisma.cardExpense.aggregate({
    _sum: { value: true },
    where: { card: filter, ...monthFilter(month) },
  });
  return result._sum.value ?? 0;
}
