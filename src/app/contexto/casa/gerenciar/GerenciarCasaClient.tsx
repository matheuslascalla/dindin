'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, UserPlus, Users, Clock, Copy, Check, Crown, ArrowLeft, Trash2 } from 'lucide-react';

import { inviteToHouse, deleteHouse } from '@/server/actions/house';

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string | null };
}

interface Invite {
  id: string;
  email: string;
}

interface Props {
  houseId: string;
  houseName: string;
  inviteCode: string | null;
  isOwner: boolean;
  members: Member[];
  pendingInvites: Invite[];
}

export function GerenciarCasaClient({
  houseId,
  houseName,
  inviteCode,
  isOwner,
  members,
  pendingInvites: initialInvites,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const [pendingInvites, setPendingInvites] = useState(initialInvites);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const invite = await inviteToHouse(houseId, email.trim().toLowerCase());
        setFeedback({ type: 'success', text: `Convite enviado para ${email}.` });
        setEmail('');
        setPendingInvites((prev) => {
          const exists = prev.find((i) => i.email === invite.email);
          if (exists) return prev.map((i) => (i.email === invite.email ? invite : i));
          return [invite, ...prev];
        });
      } catch (err) {
        setFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'Erro ao enviar convite.',
        });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{houseName}</h1>
          <p className="text-sm text-slate-500">Gerenciar membros e convites</p>
        </div>
      </div>

      {inviteCode && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Código de acesso da casa
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 select-all rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm text-slate-700">
              {inviteCode}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Compartilhe este código com quem você convidar para que eles possam entrar.
          </p>
        </div>
      )}

      {/* Convidar por e-mail (apenas owner) */}
      {isOwner && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Convidar pessoa</h2>
          </div>

          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={isPending || !email}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Enviando...' : 'Convidar'}
            </button>
          </form>

          {feedback && (
            <p
              className={`mt-2 text-xs ${feedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}
            >
              {feedback.text}
            </p>
          )}
        </div>
      )}

      {/* Membros */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-teal-500" />
          <h2 className="text-sm font-semibold text-slate-700">Membros ({members.length})</h2>
        </div>

        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                {m.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {m.user.name ?? m.user.email}
                  </p>
                  {m.role === 'owner' && (
                    <Crown size={12} className="shrink-0 text-amber-500" aria-label="Dono" />
                  )}
                </div>
                <p className="truncate text-xs text-slate-400">{m.user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Convites pendentes */}
      {isOwner && pendingInvites.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">
              Convites pendentes ({pendingInvites.length})
            </h2>
          </div>

          <ul className="space-y-2">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Mail size={14} />
                </div>
                <p className="truncate text-sm text-slate-600">{inv.email}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zona de perigo — exclusão da casa */}
      {isOwner && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">Zona de perigo</h2>
          </div>

          <p className="mb-4 text-xs text-red-600">
            Excluir a casa remove permanentemente todos os dados financeiros vinculados a ela
            (rendas, gastos, cartões e categorias). Esta ação não pode ser desfeita.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Excluir casa
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-red-700">Tem certeza?</p>
              <button
                type="button"
                onClick={() => startTransition(() => deleteHouse(houseId))}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
