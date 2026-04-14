'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';

import { joinHouse, setActiveContext } from '@/server/actions/house';

export default function EntrarCasaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const inviteCode = formData.get('inviteCode') as string;
    setError(null);

    startTransition(async () => {
      try {
        const house = await joinHouse(inviteCode);
        await setActiveContext(`house:${house.id}`);
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao entrar na casa.');
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EEF3FF] via-[#F4F9FF] to-[#F0FBF7] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/contexto"
          className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <LogIn size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Entrar em uma casa</h1>
            <p className="text-sm text-gray-500">Use o código de convite enviado pelo dono</p>
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor="inviteCode" className="mb-1 block text-sm font-medium text-gray-700">
              Código de convite
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              placeholder="Cole o código aqui..."
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              Você também precisa ter sido convidado pelo dono da casa.
            </p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
          >
            {isPending ? 'Verificando...' : 'Entrar na casa'}
          </button>
        </form>
      </div>
    </div>
  );
}
