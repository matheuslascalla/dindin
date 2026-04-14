import { auth } from '@/auth';
import { getActiveContext } from '@/lib/context';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const session = await auth();
  const activeCtx = await getActiveContext();

  const contextLabel =
    activeCtx?.type === 'house'
      ? activeCtx.houseName
      : activeCtx?.type === 'personal'
        ? 'Pessoal'
        : null;

  const houseId = activeCtx?.type === 'house' ? activeCtx.houseId : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        user={{
          name: session?.user?.name ?? null,
          email: session?.user?.email ?? null,
          image: session?.user?.image ?? null,
        }}
        contextLabel={contextLabel}
        houseId={houseId}
      />
      <main
        className="flex-1 overflow-auto"
        style={{
          background: 'linear-gradient(135deg, #EEF3FF 0%, #F4F9FF 55%, #F0FBF7 100%)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
