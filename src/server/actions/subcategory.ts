'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import { CreateSubcategorySchema, UpdateSubcategorySchema } from '@/lib/validators/subcategory';
import type { CreateSubcategoryInput, UpdateSubcategoryInput } from '@/lib/validators/subcategory';

export async function createSubcategory(data: CreateSubcategoryInput) {
  const validated = CreateSubcategorySchema.parse(data);
  const filter = await getContextFilter();

  // Garante que a categoria pai pertence ao contexto do usuário
  const category = await prisma.expenseType.findFirst({
    where: { id: validated.expenseTypeId, ...filter },
  });
  if (!category) throw new Error('Categoria não encontrada.');

  const subcategory = await prisma.subcategory.create({ data: { ...validated, ...filter } });
  revalidatePath('/categorias');
  return subcategory;
}

export async function updateSubcategory(id: string, data: UpdateSubcategoryInput) {
  const validated = UpdateSubcategorySchema.parse(data);
  const filter = await getContextFilter();

  // Garante que a categoria pai (se alterada) pertence ao contexto do usuário
  if (validated.expenseTypeId) {
    const category = await prisma.expenseType.findFirst({
      where: { id: validated.expenseTypeId, ...filter },
    });
    if (!category) throw new Error('Categoria não encontrada.');
  }

  const subcategory = await prisma.subcategory.update({
    where: { id, ...filter },
    data: validated,
  });
  revalidatePath('/categorias');
  revalidatePath('/gastos');
  return subcategory;
}

export async function deleteSubcategory(id: string) {
  const filter = await getContextFilter();

  const [expenseCount, cardExpenseCount] = await Promise.all([
    prisma.expense.count({ where: { subcategoryId: id, ...filter } }),
    prisma.cardExpense.count({ where: { subcategoryId: id, card: filter } }),
  ]);

  if (expenseCount > 0 || cardExpenseCount > 0) {
    throw new Error(
      `Não é possível deletar esta sub-categoria pois ela possui ${expenseCount + cardExpenseCount} gasto(s) vinculado(s). Remova os gastos antes de deletar.`
    );
  }

  await prisma.subcategory.delete({ where: { id, ...filter } });
  revalidatePath('/categorias');
}

export async function listSubcategoriesByCategory(expenseTypeId: string) {
  const filter = await getContextFilter();

  return prisma.subcategory.findMany({
    where: { expenseTypeId, ...filter },
    orderBy: { name: 'asc' },
  });
}
