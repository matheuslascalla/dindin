'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, Copy, Check } from 'lucide-react';
import Link from 'next/link';

import { createHouse, setActiveContext } from '@/server/actions/house';

export default function CriarCasaPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdHouse, setCreatedHouse] = useState<{
    id: string;
    name: string;
    inviteCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(formData: FormData) {
    const name = formData.get('name') as string;
    setError(null);

    startTransition(async () => {
      try {
        const house = await createHouse(name);
        setCreatedHouse(house);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar a casa.');
      }
    });
  }

  function copyCode() {
    if (!createdHouse) return;
    navigator.clipboard.writeText(createdHouse.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function enterHouse() {
    if (!createdHouse) return;
    startTransition(async () => {
      await setActiveContext(`house:${createdHouse.id}`);
      router.push('/dashboard');
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

        {!createdHouse ? (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Home size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Criar nova casa</h1>
                <p className="text-sm text-gray-500">Crie um espaço financeiro compartilhado</p>
              </div>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Nome da casa
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ex: Nossa Casa, Família Silva..."
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {isPending ? 'Criando...' : 'Criar casa'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Check size={28} />
            </div>
            <h1 className="mb-1 text-lg font-bold text-gray-900">{createdHouse.name} criada!</h1>
            <p className="mb-6 text-sm text-gray-500">
              Compartilhe o código abaixo com quem você quiser convidar.
            </p>

            <div className="mb-6 flex items-center justify-between rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3">
              <span className="font-mono text-sm font-semibold text-indigo-800">
                {createdHouse.inviteCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <button
              type="button"
              onClick={enterHouse}
              disabled={isPending}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Entrando...' : 'Entrar na casa agora'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
