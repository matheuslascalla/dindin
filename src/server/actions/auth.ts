'use server';

import { cookies } from 'next/headers';

import { signOut } from '@/auth';

/**
 * Limpa o contexto ativo e encerra a sessão do usuário.
 */
export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('dindin_ctx');

  await signOut({ redirectTo: '/login' });
}
