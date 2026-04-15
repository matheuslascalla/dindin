'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Tag,
  ArrowLeftRight,
  LogOut,
  UsersRound,
} from 'lucide-react';

import { signOutAction } from '@/server/actions/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rendas', icon: TrendingUp, label: 'Rendas' },
  { href: '/gastos', icon: ShoppingCart, label: 'Gastos' },
  { href: '/cartoes', icon: CreditCard, label: 'Cartões' },
  { href: '/categorias', icon: Tag, label: 'Categorias' },
];

interface SidebarProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  contextLabel: string | null;
  houseId: string | null;
}

export function Sidebar({ user, contextLabel, houseId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex justify-center border-b border-slate-100 px-5 py-4">
        <Image
          src="/logo.png"
          alt="DinDin"
          width={110}
          height={36}
          className="object-contain"
          priority
        />
      </div>

      {contextLabel && (
        <Link
          href="/contexto"
          className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 transition hover:bg-slate-50"
        >
          <ArrowLeftRight size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">
            <span className="font-medium text-slate-700">{contextLabel}</span>
          </span>
        </Link>
      )}

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-teal-50 font-semibold text-teal-700'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              } `}
            >
              <Icon
                size={16}
                className={`shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`}
              />
              {label}
            </Link>
          );
        })}

        {houseId && (
          <Link
            href="/contexto/casa/gerenciar"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
              pathname === '/contexto/casa/gerenciar'
                ? 'bg-indigo-50 font-semibold text-indigo-700'
                : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <UsersRound
              size={16}
              className={`shrink-0 ${pathname === '/contexto/casa/gerenciar' ? 'text-indigo-600' : 'text-slate-400'}`}
            />
            Gerenciar Casa
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'Avatar'}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-700">
              {user.name ?? 'Usuário'}
            </p>
            <p className="truncate text-[10px] text-slate-400">{user.email ?? ''}</p>
          </div>

          <button
            type="button"
            title="Sair"
            onClick={() => signOutAction()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
