import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/lib/prisma';
import { isDevMode } from '@/lib/env';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: isDevMode
    ? [
        Credentials({
          name: 'Dev Login',
          credentials: {
            email: { label: 'Email', type: 'email' },
          },
          async authorize(credentials) {
            const email = credentials?.email as string | undefined;
            if (!email) return null;

            const user =
              (await prisma.user.findUnique({ where: { email } })) ??
              (await prisma.user.create({
                data: { email, name: email.split('@')[0], emailVerified: new Date() },
              }));

            return { id: user.id, email: user.email, name: user.name };
          },
        }),
      ]
    : [Google],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 dias
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line no-param-reassign
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        // eslint-disable-next-line no-param-reassign
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
