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

  // Páginas de autenticação e seleção de contexto usam layout próprio (sem AppShell)
  const isShellRoute = !pathname.startsWith('/login') && !pathname.startsWith('/contexto');

  return (
    <html lang="pt-BR" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} antialiased`}>
        {isShellRoute ? <AppShell>{children}</AppShell> : children}
      </body>
    </html>
  );
}
