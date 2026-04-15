import Image from 'next/image';

import { signIn } from '@/auth';
import { isDevMode } from '@/lib/env';

const AUTH_REDIRECT = '/contexto';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EEF3FF] via-[#F4F9FF] to-[#F0FBF7]">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="DinDin" width={140} height={46} priority />

          <p className="text-center text-sm text-gray-500">
            Organize suas finanças com clareza e controle.
          </p>

          {isDevMode && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Modo desenvolvimento
            </span>
          )}
        </div>

        {isDevMode ? (
          <form
            action={async (formData: FormData) => {
              'use server';

              const email = formData.get('email') as string;
              await signIn('credentials', { email, redirectTo: AUTH_REDIRECT });
            }}
          >
            <div className="mb-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="dev@example.com"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Entrar (Dev)
            </button>
          </form>
        ) : (
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: AUTH_REDIRECT });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <GoogleIcon />
              Entrar com Google
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Ao entrar, você concorda com os termos de uso do DinDin.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z"
        fill="#4285F4"
      />
      <path
        d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9581H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4522 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9581L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z"
        fill="#EA4335"
      />
    </svg>
  );
}
