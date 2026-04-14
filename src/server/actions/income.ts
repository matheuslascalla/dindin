'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import {
  CreateIncomeSchema,
  UpdateIncomeSchema,
  IncomeFiltersSchema,
} from '@/lib/validators/income';
import type { CreateIncomeInput, UpdateIncomeInput, IncomeFilters } from '@/lib/validators/income';

export async function createIncome(data: CreateIncomeInput) {
  const validated = CreateIncomeSchema.parse(data);
  const filter = await getContextFilter();

  const income = await prisma.income.create({ data: { ...validated, ...filter } });
  revalidatePath('/rendas');
  revalidatePath('/dashboard');
  return income;
}

export async function updateIncome(id: string, data: UpdateIncomeInput) {
  const validated = UpdateIncomeSchema.parse(data);
  const filter = await getContextFilter();

  const income = await prisma.income.update({ where: { id, ...filter }, data: validated });
  revalidatePath('/rendas');
  revalidatePath('/dashboard');
  return income;
}

export async function deleteIncome(id: string) {
  const filter = await getContextFilter();
  await prisma.income.delete({ where: { id, ...filter } });
  revalidatePath('/rendas');
  revalidatePath('/dashboard');
}

export async function listIncomes(filters?: IncomeFilters) {
  const validated = filters ? IncomeFiltersSchema.parse(filters) : {};
  const filter = await getContextFilter();

  return prisma.income.findMany({
    where: { ...filter, ...validated },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTotalMonthlyIncome(): Promise<number> {
  const filter = await getContextFilter();

  const result = await prisma.income.aggregate({
    _sum: { value: true },
    where: { ...filter, active: true, recurrence: 'monthly' },
  });
  return result._sum.value ?? 0;
}
