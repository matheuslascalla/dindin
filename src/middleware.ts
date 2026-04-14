import { NextResponse } from 'next/server';

import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isLoginPage = nextUrl.pathname === '/login';
  const isContextRoute = nextUrl.pathname.startsWith('/contexto');
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth');

  // Passa o pathname como header para uso nos server components do layout
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Rotas públicas — sempre passam
  if (isApiAuth) return response;

  // Não autenticado → redireciona para /login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Já autenticado tentando acessar /login → redireciona para /contexto
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/contexto', nextUrl));
  }

  // Autenticado sem contexto ativo ou com cookie malformado → redireciona para /contexto
  if (isLoggedIn && !isContextRoute) {
    const ctx = req.cookies.get('dindin_ctx')?.value;
    const validCtx = ctx && /^(personal|house:[a-z0-9]+)$/.test(ctx);

    if (!validCtx) {
      const redirectRes = NextResponse.redirect(new URL('/contexto', nextUrl));
      if (ctx) redirectRes.cookies.delete('dindin_ctx'); // limpa cookie malformado
      return redirectRes;
    }
  }

  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
