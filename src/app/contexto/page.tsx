import Image from 'next/image';
import Link from 'next/link';
import { Home, User, PlusCircle, LogIn, ChevronRight, Crown } from 'lucide-react';

import { auth } from '@/auth';
import { listUserContexts, setActiveContext, seedPersonalCategories } from '@/server/actions/house';

export default async function ContextoPage() {
  const session = await auth();
  const { houses } = await listUserContexts();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EEF3FF] via-[#F4F9FF] to-[#F0FBF7] p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="DinDin" width={120} height={40} priority />

          <p className="mt-1 text-sm text-gray-500">
            Olá, <span className="font-medium text-gray-700">{session?.user?.name}</span>. Escolha
            um contexto financeiro para continuar.
          </p>
        </div>

        <div className="space-y-3">
          {/* Contexto pessoal */}
          <form
            action={async () => {
              'use server';

              await seedPersonalCategories();
              await setActiveContext('personal');
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Controle Pessoal</p>
                <p className="text-xs text-gray-500">Dados exclusivos da sua conta</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </form>

          {/* Casas do usuário */}
          {houses.map((house) => (
            <form
              key={house.id}
              action={async () => {
                'use server';
                await setActiveContext(`house:${house.id}`);
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Home size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{house.name}</p>
                    {house.role === 'owner' && (
                      <Crown size={14} className="text-amber-500" aria-label="Você é o dono" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Controle financeiro da casa</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </form>
          ))}

          {/* Ações de casa */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/contexto/casa/criar"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
            >
              <PlusCircle size={16} />
              Criar nova casa
            </Link>

            <Link
              href="/contexto/casa/entrar"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <LogIn size={16} />
              Entrar em uma casa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
