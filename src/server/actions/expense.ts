'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import { CreateExpenseSchema, UpdateExpenseSchema } from '@/lib/validators/expense';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/lib/validators/expense';
import { utcStartOfMonth, utcEndOfMonth, cardExpenseMonthFilter } from '@/lib/utils';

export type UnifiedExpense = {
  id: string;
  name: string;
  value: number;
  date: Date;
  description?: string | null;
  person?: string | null;
  expenseType: { id: string; name: string; color: string; icon: string };
  source: 'expense' | 'card';
  paymentMethod?: 'PIX' | 'MONEY';
  cardId?: string;
  cardName?: string;
  recurrence?: string;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  installmentGroupId?: string | null;
};

export async function createExpense(data: CreateExpenseInput) {
  const validated = CreateExpenseSchema.parse(data);
  const filter = await getContextFilter();

  const expense = await prisma.expense.create({
    data: { ...validated, ...filter },
    include: { expenseType: true },
  });
  revalidatePath('/gastos');
  revalidatePath('/dashboard');
  return expense;
}

export async function updateExpense(id: string, data: UpdateExpenseInput) {
  const validated = UpdateExpenseSchema.parse(data);
  const filter = await getContextFilter();

  const expense = await prisma.expense.update({
    where: { id, ...filter },
    data: validated,
    include: { expenseType: true },
  });
  revalidatePath('/gastos');
  revalidatePath('/dashboard');
  return expense;
}

export async function deleteExpense(id: string) {
  const filter = await getContextFilter();
  await prisma.expense.delete({ where: { id, ...filter } });
  revalidatePath('/gastos');
  revalidatePath('/dashboard');
}

export async function listExpenses(month?: Date) {
  const filter = await getContextFilter();
  const dateFilter = month
    ? { date: { gte: utcStartOfMonth(month), lte: utcEndOfMonth(month) } }
    : {};

  return prisma.expense.findMany({
    where: { ...filter, ...dateFilter },
    include: { expenseType: true },
    orderBy: { date: 'desc' },
  });
}

export async function listAllExpenses(params: {
  month?: Date;
  categoryId?: string;
  paymentMethod?: 'PIX' | 'MONEY' | 'CARD';
  person?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: UnifiedExpense[]; total: number; totalValue: number; pageCount: number }> {
  const { month, categoryId, paymentMethod, person, page = 1, pageSize = 10 } = params;
  const filter = await getContextFilter();

  const start = month ? utcStartOfMonth(month) : utcStartOfMonth(new Date());
  const end = month ? utcEndOfMonth(month) : utcEndOfMonth(new Date());

  const fetchExpenses = paymentMethod !== 'CARD';
  const fetchCards = paymentMethod !== 'PIX' && paymentMethod !== 'MONEY';

  const [rawExpenses, rawCardExpenses] = await Promise.all([
    fetchExpenses
      ? prisma.expense.findMany({
          where: {
            ...filter,
            date: { gte: start, lte: end },
            ...(categoryId ? { expenseTypeId: categoryId } : {}),
            ...(paymentMethod ? { paymentMethod } : {}),
            ...(person ? { person } : {}),
          },
          include: { expenseType: true },
          orderBy: { date: 'desc' },
        })
      : Promise.resolve([]),

    fetchCards
      ? prisma.cardExpense.findMany({
          where: {
            card: filter.userId ? { userId: filter.userId } : { houseId: filter.houseId },
            ...cardExpenseMonthFilter(start, end),
            ...(categoryId ? { expenseTypeId: categoryId } : {}),
            ...(person ? { person } : {}),
          },
          include: {
            expenseType: true,
            card: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  const expenses: UnifiedExpense[] = rawExpenses.map((e) => ({
    id: e.id,
    name: e.name,
    value: e.value,
    date: e.date,
    description: e.description,
    person: e.person,
    expenseType: {
      id: e.expenseType.id,
      name: e.expenseType.name,
      color: e.expenseType.color,
      icon: e.expenseType.icon,
    },
    source: 'expense',
    paymentMethod: e.paymentMethod as 'PIX' | 'MONEY',
  }));

  const cardExpenses: UnifiedExpense[] = rawCardExpenses.map((ce) => ({
    id: ce.id,
    name: ce.name,
    value: ce.value,
    date: ce.date,
    description: ce.description,
    person: ce.person,
    expenseType: {
      id: ce.expenseType.id,
      name: ce.expenseType.name,
      color: ce.expenseType.color,
      icon: ce.expenseType.icon,
    },
    source: 'card',
    cardId: ce.card.id,
    cardName: ce.card.name,
    recurrence: ce.recurrence,
    installmentNumber: ce.installmentNumber,
    installmentTotal: ce.installmentTotal,
    installmentGroupId: ce.installmentGroupId,
  }));

  const merged = [...expenses, ...cardExpenses].sort((a, b) => b.date.getTime() - a.date.getTime());

  const total = merged.length;
  const totalValue = merged.reduce((sum, e) => sum + e.value, 0);
  const pageCount = Math.ceil(total / pageSize);
  const items = merged.slice((page - 1) * pageSize, page * pageSize);

  return { items, total, totalValue, pageCount };
}

export async function getExpenseTotal(month: Date): Promise<number> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);

  const result = await prisma.expense.aggregate({
    _sum: { value: true },
    where: { ...filter, date: { gte: start, lte: end } },
  });
  return result._sum.value ?? 0;
}
