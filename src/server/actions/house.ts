'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/context';

// Categorias padrão conforme as regras de negócio (business.md)
const DEFAULT_CATEGORIES = [
  { name: 'Custos Fixos', limitPercent: 40, color: '#6366f1', icon: 'home' },
  { name: 'Metas', limitPercent: 5, color: '#10b981', icon: 'target' },
  { name: 'Conforto', limitPercent: 20, color: '#f59e0b', icon: 'sofa' },
  { name: 'Prazeres', limitPercent: 5, color: '#ec4899', icon: 'heart' },
  { name: 'Liberdade Financeira', limitPercent: 25, color: '#8b5cf6', icon: 'trending-up' },
  { name: 'Conhecimento', limitPercent: 5, color: '#06b6d4', icon: 'book-open' },
];

// ─── Contexto ────────────────────────────────────────────────────────────────

/**
 * Define o contexto ativo do usuário e redireciona para o dashboard.
 * Cookie: "personal" ou "house:{houseId}"
 */
export async function setActiveContext(contextValue: string) {
  const cookieStore = await cookies();

  cookieStore.set('dindin_ctx', contextValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/dashboard');
}

/**
 * Retorna os contextos disponíveis para o usuário logado:
 * - sempre inclui o contexto pessoal
 * - inclui todas as casas em que o usuário é membro
 */
export async function listUserContexts() {
  const userId = await requireAuth();

  const memberships = await prisma.houseMember.findMany({
    where: { userId },
    include: {
      house: {
        select: { id: true, name: true, inviteCode: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return {
    personal: { userId },
    houses: memberships.map((m) => ({
      ...m.house,
      role: m.role as 'owner' | 'member',
    })),
  };
}

// ─── Casa ─────────────────────────────────────────────────────────────────────

/**
 * Cria uma nova casa, adiciona o usuário como owner e semeia as 6 categorias padrão.
 */
export async function createHouse(name: string) {
  const userId = await requireAuth();

  if (!name || name.trim().length < 2) {
    throw new Error('O nome da casa deve ter ao menos 2 caracteres.');
  }

  const house = await prisma.house.create({
    data: {
      name: name.trim(),
      members: {
        create: { userId, role: 'owner' },
      },
      categories: {
        createMany: { data: DEFAULT_CATEGORIES },
      },
    },
  });

  return house;
}

/**
 * Entra em uma casa existente usando o código de convite.
 * Verifica se o e-mail do usuário foi previamente convidado para aquela casa.
 */
export async function joinHouse(inviteCode: string) {
  const userId = await requireAuth();

  const house = await prisma.house.findUnique({
    where: { inviteCode: inviteCode.trim() },
  });

  if (!house) {
    throw new Error('Código de convite inválido. Verifique e tente novamente.');
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new Error('Usuário não encontrado.');

  // All checks and writes inside a single transaction to prevent TOCTOU:
  // two concurrent requests with the same invite cannot both succeed.
  await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.houseMember.findUnique({
      where: { userId_houseId: { userId, houseId: house.id } },
    });
    if (existingMembership) throw new Error('Você já é membro dessa casa.');

    const invite = await tx.houseInvite.findUnique({
      where: { houseId_email: { houseId: house.id, email: user.email } },
    });
    if (!invite || invite.usedAt !== null) {
      throw new Error(
        'Você não possui um convite pendente para esta casa. Peça ao dono para te convidar primeiro.'
      );
    }

    await tx.houseMember.create({ data: { userId, houseId: house.id, role: 'member' } });
    await tx.houseInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  });

  return house;
}

/**
 * Convida um e-mail para uma casa. Apenas o owner pode convidar.
 */
export async function inviteToHouse(houseId: string, email: string) {
  const userId = await requireAuth();

  if (!z.string().email().safeParse(email).success) {
    throw new Error('Informe um e-mail válido.');
  }

  // Verifica que o usuário é owner da casa
  const membership = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });

  if (!membership || membership.role !== 'owner') {
    throw new Error('Apenas o dono da casa pode enviar convites.');
  }

  // Verifica se o e-mail já é membro
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const isMember = await prisma.houseMember.findUnique({
      where: { userId_houseId: { userId: existingUser.id, houseId } },
    });
    if (isMember) throw new Error('Este e-mail já é membro da casa.');
  }

  // Cria ou atualiza o convite (permite re-convidar se o anterior foi cancelado)
  const invite = await prisma.houseInvite.upsert({
    where: { houseId_email: { houseId, email } },
    create: { houseId, email, invitedById: userId },
    update: { usedAt: null, invitedById: userId, createdAt: new Date() },
  });

  revalidatePath('/contexto');
  return invite;
}

/**
 * Retorna os detalhes de uma casa: membros e convites pendentes.
 * Apenas membros da casa podem visualizar.
 */
export async function getHouseDetails(houseId: string) {
  const userId = await requireAuth();

  const [membership, house] = await Promise.all([
    prisma.houseMember.findUnique({ where: { userId_houseId: { userId, houseId } } }),
    prisma.house.findUnique({
      where: { id: houseId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        invites: { where: { usedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    }),
  ]);

  if (!membership) throw new Error('Você não tem acesso a esta casa.');

  return house ? { ...house, isOwner: membership.role === 'owner' } : null;
}

/**
 * Exclui uma casa. Apenas o owner pode excluir.
 * Remove em cascata: membros, convites, categorias, despesas, rendas e cartões da casa.
 */
export async function deleteHouse(houseId: string) {
  const userId = await requireAuth();

  const membership = await prisma.houseMember.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });

  if (!membership || membership.role !== 'owner') {
    throw new Error('Apenas o dono da casa pode excluí-la.');
  }

  await prisma.house.delete({ where: { id: houseId } });

  // Limpa o cookie de contexto antes de redirecionar
  const cookieStore = await cookies();
  cookieStore.delete('dindin_ctx');

  redirect('/contexto');
}

/**
 * Inicializa as 6 categorias padrão para o contexto pessoal do usuário,
 * caso ainda não existam. Chamado no primeiro acesso ao contexto pessoal.
 */
export async function seedPersonalCategories() {
  const userId = await requireAuth();

  const existing = await prisma.expenseType.count({ where: { userId } });
  if (existing > 0) return;

  await prisma.expenseType.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
}
