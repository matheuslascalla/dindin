import { cache } from 'react';
import { cookies } from 'next/headers';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type ActiveContext =
  | { type: 'personal'; userId: string }
  | { type: 'house'; houseId: string; houseName: string };

/**
 * Retorna o contexto financeiro ativo do usuário logado.
 * Lê o cookie `dindin_ctx` e valida que o usuário tem acesso ao contexto.
 *
 * Formatos do cookie:
 *  - "personal"         → contexto pessoal do usuário
 *  - "house:{houseId}"  → contexto de uma casa específica
 *
 */
export const getActiveContext = cache(async (): Promise<ActiveContext | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const ctxCookie = cookieStore.get('dindin_ctx')?.value;

  if (!ctxCookie) return null;

  if (ctxCookie === 'personal') {
    return { type: 'personal', userId: session.user.id };
  }

  if (ctxCookie.startsWith('house:')) {
    const houseId = ctxCookie.replace('house:', '');

    // Verifica que o usuário é membro da casa
    const membership = await prisma.houseMember.findUnique({
      where: { userId_houseId: { userId: session.user.id, houseId } },
      include: { house: { select: { name: true } } },
    });

    if (!membership) return null;

    return { type: 'house', houseId, houseName: membership.house.name };
  }

  return null;
});

/**
 * Retorna o filtro Prisma correto para o contexto ativo.
 * Use em todas as queries das server actions.
 *
 * Exemplo de uso:
 *   const filter = await getContextFilter();
 *   await prisma.income.findMany({ where: { ...filter } });
 */
export async function getContextFilter() {
  const ctx = await getActiveContext();
  if (!ctx) throw new Error('Nenhum contexto financeiro ativo.');

  if (ctx.type === 'personal') {
    return { userId: ctx.userId, houseId: null };
  }

  return { houseId: ctx.houseId, userId: null };
}

/**
 * Retorna o userId da sessão atual ou lança erro se não autenticado.
 */
export async function requireAuth(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Não autenticado.');
  return session.user.id;
}
