'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Megaphone, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { brl } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar, ErrorText, PageLoader, Spinner } from '@/components/ui';
import type { AdminSummary, User } from '@/lib/types';

export default function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/');
  }, [isAdmin, isLoading, router]);

  const { data: summary } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => api.get<AdminSummary>('/stats/summary'),
    enabled: isAdmin,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
    enabled: isAdmin,
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
    queryClient.invalidateQueries({ queryKey: ['community'] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api.patch(`/users/${id}/${action}`),
    onSuccess: refetchAll,
    onError: (err: Error) => setError(err.message),
  });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'ADMIN' | 'PLAYER' }) =>
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: refetchAll,
    onError: (err: Error) => setError(err.message),
  });

  const removeUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: refetchAll,
    onError: (err: Error) => setError(err.message),
  });

  const broadcast = useMutation({
    mutationFn: (body: { title: string; message: string }) =>
      api.post('/push/broadcast', body),
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading || !isAdmin) return <PageLoader />;

  const pending = (users ?? []).filter((u) => u.status === 'PENDING');
  const approved = (users ?? []).filter((u) => u.status === 'APPROVED');
  const rejected = (users ?? []).filter((u) => u.status === 'REJECTED');

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Organização
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Aguardando aprovação" value={String(summary?.pendingUsers ?? 0)} />
        <Tile label="Peladas marcadas" value={String(summary?.upcomingGames ?? 0)} />
        <Tile
          label="A receber"
          value={brl(summary?.totalPendingAmount ?? 0)}
          tone="warn"
        />
        <Tile label="Peladas realizadas" value={String(summary?.finishedGames ?? 0)} />
      </div>

      <ErrorText>{error}</ErrorText>

      {/* Aprovações */}
      <section className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
          <UserCheck className="h-4 w-4" />
          Cadastros pendentes ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-400">
            Nada esperando aprovação.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {pending.map((person) => {
              const personId = person.id ?? String(person._id);
              return (
                <li key={personId} className="flex items-center gap-3 py-3">
                  <Avatar name={person.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{person.name}</p>
                    <p className="truncate text-xs text-ink-400">{person.email}</p>
                  </div>
                  <button
                    onClick={() =>
                      setStatus.mutate({ id: personId, action: 'approve' })
                    }
                    className="btn bg-emerald-600 px-3 py-2 text-xs text-white"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setStatus.mutate({ id: personId, action: 'reject' })
                    }
                    className="btn-ghost px-3 py-2 text-xs text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Devedores */}
      {summary && summary.debtors.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
            Quem está devendo
          </h2>
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {summary.debtors.map((row) => (
              <li key={row.userId} className="flex items-center gap-3 py-2.5">
                <Avatar name={row.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="text-xs text-ink-400">
                    {row.pendingGames} pelada(s) em aberto
                  </p>
                </div>
                <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {brl(row.pendingAmount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recado geral */}
      <BroadcastCard
        onSend={(title, message) => broadcast.mutate({ title, message })}
        sending={broadcast.isPending}
        sent={broadcast.isSuccess}
      />

      {/* Comunidade */}
      <section className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
          <ShieldCheck className="h-4 w-4" />
          Comunidade ({approved.length})
        </h2>
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {[...approved, ...rejected].map((person) => {
            const personId = person.id ?? String(person._id);
            return (
              <li key={personId} className="flex items-center gap-3 py-2.5">
                <Avatar
                  name={person.name}
                  className={person.status === 'REJECTED' ? 'bg-ink-400' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {person.name}
                    {person.status === 'REJECTED' && (
                      <span className="ml-1.5 text-xs font-normal text-red-500">
                        recusado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-400">{person.email}</p>
                </div>

                {person.status === 'APPROVED' && (
                  <button
                    onClick={() =>
                      setRole.mutate({
                        id: personId,
                        role: person.role === 'ADMIN' ? 'PLAYER' : 'ADMIN',
                      })
                    }
                    className={cn(
                      'badge',
                      person.role === 'ADMIN'
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                        : 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400',
                    )}
                    title="Alternar organizador"
                  >
                    {person.role === 'ADMIN' ? 'organizador' : 'jogador'}
                  </button>
                )}

                <button
                  onClick={() => {
                    if (window.confirm(`Remover ${person.name} da comunidade?`)) {
                      removeUser.mutate(personId);
                    }
                  }}
                  className="text-ink-300 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = 'ok',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="card p-4">
      <p
        className={cn(
          'font-display text-2xl font-extrabold',
          tone === 'warn' ? 'text-brand-600' : 'text-court-700 dark:text-court-400',
        )}
      >
        {value}
      </p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

function BroadcastCard({
  onSend,
  sending,
  sent,
}: {
  onSend: (title: string, message: string) => void;
  sending: boolean;
  sent: boolean;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  return (
    <section className="card space-y-3 p-4">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
        <Megaphone className="h-4 w-4" />
        Recado para a turma
      </h2>
      <input
        className="input"
        placeholder="Título (ex.: Quadra mudou!)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="input"
        rows={2}
        placeholder="Mensagem que chega como notificação"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={() => {
          onSend(title, message);
          setTitle('');
          setMessage('');
        }}
        disabled={sending || !title || !message}
        className="btn-court w-full"
      >
        {sending ? <Spinner /> : sent ? 'Enviado!' : 'Enviar notificação'}
      </button>
    </section>
  );
}
