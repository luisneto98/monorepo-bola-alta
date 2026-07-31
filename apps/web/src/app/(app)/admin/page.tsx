'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Megaphone, Trash2, X } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { brl } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Avatar,
  ErrorText,
  PageLoader,
  SectionTitle,
  Spinner,
} from '@/components/ui';
import type { AdminSummary, Game, User } from '@/lib/types';

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

  // O bot deixa aqui o que a turma marcou pelo grupo do WhatsApp.
  const { data: games } = useQuery({
    queryKey: ['games', 'all'],
    queryFn: () => api.get<Game[]>('/games?scope=all'),
    enabled: isAdmin,
  });

  const refetchGames = () => {
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
  };

  const setGameApproval = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api.post(`/games/${id}/${action}`),
    onSuccess: refetchGames,
    onError: (err: Error) => setError(err.message),
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

  const pendingGames = (games ?? []).filter((g) => g.approval === 'PENDING');
  const pending = (users ?? []).filter((u) => u.status === 'PENDING');
  const approved = (users ?? []).filter((u) => u.status === 'APPROVED');
  const rejected = (users ?? []).filter((u) => u.status === 'REJECTED');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading text-3xl">Organização</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Aprovações, caixa e recados da turma.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          label="Aguardando"
          value={String(summary?.pendingUsers ?? 0)}
          tone={summary?.pendingUsers ? 'warn' : 'fg'}
        />
        <Tile
          label="Peladas a aprovar"
          value={String(pendingGames.length)}
          tone={pendingGames.length ? 'warn' : 'fg'}
        />
        <Tile
          label="A receber"
          value={brl(summary?.totalPendingAmount ?? 0)}
          tone={summary?.totalPendingAmount ? 'stop' : 'go'}
        />
        <Tile label="Já realizadas" value={String(summary?.finishedGames ?? 0)} />
      </div>

      <ErrorText>{error}</ErrorText>

      {/* Peladas marcadas pela turma, esperando liberação */}
      {pendingGames.length > 0 && (
        <section className="panel p-4">
          <SectionTitle>Peladas a aprovar · {pendingGames.length}</SectionTitle>

          <ul className="stagger divide-y-2 divide-line-soft">
            {pendingGames.map((game) => (
              <li key={game.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-warn/40 text-warn">
                  <CalendarClock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{game.title}</p>
                  <p className="truncate text-xs text-fg-dim">
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(game.date))}{' '}
                    · {game.location.name}
                    {game.whatsapp ? ' · pelo WhatsApp' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setGameApproval.mutate({ id: game.id, action: 'approve' })}
                  aria-label={`Aprovar ${game.title}`}
                  className="btn border-go bg-go px-3 text-canvas hover:bg-go/80"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGameApproval.mutate({ id: game.id, action: 'reject' })}
                  aria-label={`Recusar ${game.title}`}
                  className="btn-danger px-3"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Aprovações */}
      <section className="panel p-4">
        <SectionTitle>Cadastros pendentes · {pending.length}</SectionTitle>

        {pending.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-dim">
            Nada esperando aprovação.
          </p>
        ) : (
          <ul className="stagger divide-y-2 divide-line-soft">
            {pending.map((person) => {
              const personId = person.id ?? String(person._id);
              return (
                <li key={personId} className="flex items-center gap-3 py-3">
                  <Avatar name={person.name} tone="mute" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{person.name}</p>
                    <p className="truncate text-xs text-fg-dim">{person.email}</p>
                  </div>
                  <button
                    onClick={() => setStatus.mutate({ id: personId, action: 'approve' })}
                    aria-label={`Aprovar ${person.name}`}
                    className="btn border-go bg-go px-3 text-canvas hover:bg-go/80"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setStatus.mutate({ id: personId, action: 'reject' })}
                    aria-label={`Recusar ${person.name}`}
                    className="btn-danger px-3"
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
        <section className="panel p-4">
          <SectionTitle>Quem está devendo</SectionTitle>
          <ul className="divide-y-2 divide-line-soft">
            {summary.debtors.map((row) => (
              <li key={row.userId} className="flex items-center gap-3 py-2.5">
                <Avatar name={row.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="text-xs text-fg-dim">
                    {row.pendingGames} pelada(s) em aberto
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-stop">
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
      <section className="panel p-4">
        <SectionTitle>Comunidade · {approved.length}</SectionTitle>
        <ul className="divide-y-2 divide-line-soft">
          {[...approved, ...rejected].map((person) => {
            const personId = person.id ?? String(person._id);
            const isRejected = person.status === 'REJECTED';
            return (
              <li key={personId} className="flex items-center gap-3 py-2.5">
                <Avatar name={person.name} tone={isRejected ? 'mute' : 'court'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {person.name}
                    {isRejected && (
                      <span className="ml-1.5 font-display text-[10px] uppercase tracking-wide text-stop">
                        recusado
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-fg-dim">{person.email}</p>
                </div>

                {person.status === 'APPROVED' && (
                  <button
                    onClick={() =>
                      setRole.mutate({
                        id: personId,
                        role: person.role === 'ADMIN' ? 'PLAYER' : 'ADMIN',
                      })
                    }
                    title="Alternar organizador"
                    className={
                      person.role === 'ADMIN'
                        ? 'badge border-brand/60 bg-brand/15 text-brand'
                        : 'badge-mute'
                    }
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
                  aria-label={`Remover ${person.name}`}
                  className="flex h-11 w-11 items-center justify-center text-fg-dim hover:text-stop"
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
  tone = 'fg',
}: {
  label: string;
  value: string;
  tone?: 'fg' | 'warn' | 'stop' | 'go';
}) {
  return (
    <div className="panel p-4">
      <p
        className={cn(
          'font-display text-2xl font-bold leading-none',
          tone === 'warn' && 'text-warn',
          tone === 'stop' && 'text-stop',
          tone === 'go' && 'text-go',
        )}
      >
        {value}
      </p>
      <p className="eyebrow mt-2">{label}</p>
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
    <section className="panel space-y-3 p-4">
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          <Megaphone className="h-3.5 w-3.5" /> Recado para a turma
        </span>
      </SectionTitle>
      <input
        className="input"
        placeholder="Título (ex.: A quadra mudou)"
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
        {sending ? <Spinner /> : sent ? 'Enviado' : 'Enviar notificação'}
      </button>
    </section>
  );
}
