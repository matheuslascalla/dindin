import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';

import { AppShell } from '@/components/layout/AppShell';

const plusJakarta = Poppins({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'DinDin — Controle Financeiro',
  description: 'Organize suas finanças com clareza e controle.',
  icons: 'favicon.png',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/';

  // /contexto/casa/gerenciar precisa de shell, então não usamos startsWith genérico em /contexto.
  const NO_SHELL_ROUTES = ['/login', '/contexto'];
  const NO_SHELL_PREFIXES = ['/contexto/casa/criar', '/contexto/casa/entrar'];
  const isShellRoute =
    !NO_SHELL_ROUTES.includes(pathname) && !NO_SHELL_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <html lang="pt-BR" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} antialiased`}>
        {isShellRoute ? <AppShell>{children}</AppShell> : children}
      </body>
    </html>
  );
}
