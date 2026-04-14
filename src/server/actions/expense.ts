'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import { CreateExpenseSchema, UpdateExpenseSchema } from '@/lib/validators/expense';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/lib/validators/expense';
import { utcStartOfMonth, utcEndOfMonth } from '@/lib/utils';

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
