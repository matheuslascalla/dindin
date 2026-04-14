'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import { CreateCategorySchema, UpdateCategorySchema } from '@/lib/validators/category';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/validators/category';

export async function createCategory(data: CreateCategoryInput) {
  const validated = CreateCategorySchema.parse(data);
  const filter = await getContextFilter();

  const category = await prisma.expenseType.create({ data: { ...validated, ...filter } });
  revalidatePath('/categorias');
  return category;
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const validated = UpdateCategorySchema.parse(data);
  const filter = await getContextFilter();

  const category = await prisma.expenseType.update({ where: { id, ...filter }, data: validated });
  revalidatePath('/categorias');
  revalidatePath('/gastos');
  revalidatePath('/cartoes');
  revalidatePath('/dashboard');
  return category;
}

export async function deleteCategory(id: string) {
  const filter = await getContextFilter();

  const [expenseCount, cardExpenseCount] = await Promise.all([
    prisma.expense.count({ where: { expenseTypeId: id, ...filter } }),
    prisma.cardExpense.count({ where: { expenseTypeId: id, card: filter } }),
  ]);

  if (expenseCount > 0 || cardExpenseCount > 0) {
    throw new Error(
      `Não é possível deletar esta categoria pois ela possui ${expenseCount + cardExpenseCount} gasto(s) vinculado(s). Remova os gastos antes de deletar.`
    );
  }

  await prisma.expenseType.delete({ where: { id, ...filter } });
  revalidatePath('/categorias');
  revalidatePath('/dashboard');
}

export async function listCategories() {
  const filter = await getContextFilter();

  return prisma.expenseType.findMany({
    where: filter,
    orderBy: { name: 'asc' },
  });
}
