'use server';

import { prisma } from '@/lib/prisma';

type ContextFilter = { userId: string | null; houseId: string | null };

/**
 * Verifica em paralelo que a categoria e (opcionalmente) a sub-categoria
 * pertencem ao contexto do usuário. Usado antes de criar ou atualizar gastos.
 */
export async function assertCategoryOwnership(
  filter: ContextFilter,
  expenseTypeId: string | undefined,
  subcategoryId: string | undefined
): Promise<void> {
  const checks: Promise<void>[] = [];

  if (expenseTypeId) {
    checks.push(
      prisma.expenseType.findFirst({ where: { id: expenseTypeId, ...filter } }).then((cat) => {
        if (!cat) throw new Error('Categoria não encontrada.');
      })
    );
  }

  if (subcategoryId) {
    checks.push(
      prisma.subcategory.findFirst({ where: { id: subcategoryId, ...filter } }).then((sub) => {
        if (!sub) throw new Error('Sub-categoria não encontrada.');
      })
    );
  }

  await Promise.all(checks);
}
