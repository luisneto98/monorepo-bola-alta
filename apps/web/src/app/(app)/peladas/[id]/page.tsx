'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Ban,
  Check,
  CircleCheck,
  Clock,
  MapPin,
  Pencil,
  Share2,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { brl, formatFull, formatTime, POSITION_LABELS } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Avatar,
  EmptyState,
  ErrorText,
  GameStatusBadge,
  PageLoader,
  PlayersProgress,
  Spinner,
} from '@/components/ui';
import { InviteSheet } from '@/components/invite-sheet';
import type { GameDetail, GamePlayer, User } from '@/lib/types';

export default function PeladaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', id],
    queryFn: () => api.get<GameDetail>(`/games/${id}`),
  });

  const invalidate = (data: GameDetail) => {
    queryClient.setQueryData(['game', id], data);
    queryClient.invalidateQueries({ queryKey: ['games'] });
    queryClient.invalidateQueries({ queryKey: ['invite', id] });
  };

  const join = useMutationSafe(
    () => api.post<GameDetail>(`/games/${id}/join`),
    invalidate,
    setError,
  );
  const leave = useMutationSafe(
    () => api.post<GameDetail>(`/games/${id}/leave`),
    invalidate,
    setError,
  );

  const togglePaid = useMutation({
    mutationFn: ({ userId, paid }: { userId: string; paid: boolean }) =>
      api.patch<GameDetail>(`/games/${id}/players/${userId}/payment`, { paid }),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const removePlayer = useMutation({
    mutationFn: (userId: string) =>
      api.delete<GameDetail>(`/games/${id}/players/${userId}`),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const cancelGame = useMutation({
    mutationFn: (reason: string) =>
      api.post<GameDetail>(`/games/${id}/cancel`, { reason }),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const finishGame = useMutation({
    mutationFn: () => api.post<GameDetail>(`/games/${id}/finish`),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  });

  const deleteGame = useMutation({
    mutationFn: () => api.delete(`/games/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      router.replace('/');
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading || !game) return <PageLoader />;

  const canceled = game.status === 'CANCELED';
  const finished = game.status === 'FINISHED';
  const isIn = game.me.status === 'CONFIRMED' || game.me.status === 'WAITLIST';
  const busy = join.isPending || leave.isPending;

  return (
    <div className="space-y-4 pb-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm font-medium text-ink-500 dark:text-ink-400"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Cabeçalho */}
      <div className="card animate-fade-up overflow-hidden">
        <div
          className={cn(
            'px-5 py-5 text-white',
            canceled
              ? 'bg-ink-500'
              : game.status === 'CONFIRMED'
                ? 'bg-emerald-600'
                : 'bg-court-700',
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-extrabold leading-tight">
              {game.title}
            </h1>
            <GameStatusBadge status={game.status} />
          </div>
          <p className="text-sm text-white/85">{formatFull(game.date)}</p>
          {canceled && game.cancelReason && (
            <p className="mt-2 rounded-lg bg-black/20 px-3 py-2 text-sm">
              Motivo: {game.cancelReason}
            </p>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoLine icon={<Clock className="h-4 w-4" />}>
              {formatTime(game.date)} · {game.durationMinutes} min
            </InfoLine>
            <InfoLine icon={<Users className="h-4 w-4" />}>
              mín. {game.minPlayers} · máx. {game.maxPlayers}
            </InfoLine>
            <InfoLine icon={<MapPin className="h-4 w-4" />} className="col-span-2">
              {game.location.mapsUrl ? (
                <a
                  href={game.location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-court-700 underline dark:text-court-400"
                >
                  {game.location.name}
                </a>
              ) : (
                game.location.name
              )}
              {game.location.address && (
                <span className="block text-xs text-ink-400">
                  {game.location.address}
                </span>
              )}
            </InfoLine>
            {game.cost > 0 && (
              <InfoLine icon={<Wallet className="h-4 w-4" />} className="col-span-2">
                <span className="font-semibold text-ink-900 dark:text-ink-100">
                  {brl(game.costPerPlayer)} por pessoa
                </span>
                <span className="block text-xs text-ink-400">
                  quadra {brl(game.cost)} ÷ {game.confirmedCount || 0} confirmados
                  {game.confirmedCount < game.maxPlayers &&
                    ' — quanto mais gente, mais barato'}
                </span>
              </InfoLine>
            )}
          </div>

          {game.notes && (
            <p className="rounded-xl bg-ink-100 px-3 py-2 text-sm text-ink-600 dark:bg-ink-950 dark:text-ink-300">
              📝 {game.notes}
            </p>
          )}

          {!canceled && (
            <div className="space-y-2">
              <PlayersProgress
                confirmed={game.confirmedCount}
                min={game.minPlayers}
                max={game.maxPlayers}
              />
              <p className="text-sm text-ink-500 dark:text-ink-400">
                {game.status === 'CONFIRMED' ? (
                  <>
                    <strong className="text-emerald-600">Pelada confirmada!</strong>{' '}
                    {game.spotsLeft > 0
                      ? `Ainda cabem ${game.spotsLeft}.`
                      : 'Vagas esgotadas — dá pra entrar na espera.'}
                  </>
                ) : (
                  <>
                    Faltam <strong>{game.missingToConfirm}</strong>{' '}
                    {game.missingToConfirm === 1 ? 'pessoa' : 'pessoas'} para a pelada
                    valer.
                  </>
                )}
              </p>
            </div>
          )}

          <ErrorText>{error}</ErrorText>

          {/* Ação principal do jogador */}
          {!canceled && !finished && (
            <div className="flex gap-2">
              {isIn ? (
                <button
                  onClick={() => leave.mutate()}
                  disabled={busy}
                  className="btn-ghost flex-1"
                >
                  {busy ? <Spinner /> : <X className="h-4 w-4" />}
                  {game.me.status === 'WAITLIST' ? 'Sair da espera' : 'Não vou mais'}
                </button>
              ) : (
                <button
                  onClick={() => join.mutate()}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy ? <Spinner /> : <Check className="h-4 w-4" />}
                  {game.spotsLeft > 0 ? 'Confirmar presença' : 'Entrar na espera'}
                </button>
              )}
              <button
                onClick={() => setShowInvite(true)}
                className="btn-ghost px-4"
                title="Convite do WhatsApp"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {game.me.status === 'WAITLIST' && game.me.waitlistPosition && (
            <p className="rounded-xl bg-court-50 px-3 py-2 text-center text-sm font-medium text-court-800 dark:bg-court-950 dark:text-court-300">
              Você é o {game.me.waitlistPosition}º da lista de espera — a gente te
              avisa se abrir vaga.
            </p>
          )}

          {(canceled || finished) && (
            <button onClick={() => setShowInvite(true)} className="btn-ghost w-full">
              <Share2 className="h-4 w-4" /> Ver mensagem do WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Painel do organizador */}
      {isAdmin && (
        <div className="card space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
            Organizador
          </p>

          {game.cost > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-ink-100 px-3 py-2 text-sm dark:bg-ink-950">
              <span className="text-ink-500 dark:text-ink-400">Caixa da pelada</span>
              <span className="font-semibold">
                {brl(game.totalPaid)} de {brl(game.cost)} ·{' '}
                <span className={game.paidCount === game.confirmedCount ? 'text-emerald-600' : 'text-brand-600'}>
                  {game.paidCount}/{game.confirmedCount} pagaram
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link href={`/peladas/${id}/editar`} className="btn-ghost text-xs">
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="btn-ghost text-xs"
            >
              <UserPlus className="h-4 w-4" /> Add jogador
            </button>

            {!finished && !canceled && (
              <>
                <button
                  onClick={() => {
                    const reason = window.prompt('Motivo do cancelamento (opcional):');
                    if (reason !== null) cancelGame.mutate(reason);
                  }}
                  className="btn-ghost text-xs text-red-600"
                >
                  <Ban className="h-4 w-4" /> Cancelar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Encerrar a pelada e fechar o acerto?')) {
                      finishGame.mutate();
                    }
                  }}
                  className="btn-ghost text-xs"
                >
                  <CircleCheck className="h-4 w-4" /> Encerrar
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (window.confirm('Apagar a pelada de vez? Não dá pra desfazer.')) {
                  deleteGame.mutate();
                }
              }}
              className="btn-ghost col-span-2 text-xs text-red-600"
            >
              <Trash2 className="h-4 w-4" /> Apagar pelada
            </button>
          </div>
        </div>
      )}

      {/* Listas */}
      <PlayerList
        title={`Confirmados (${game.confirmed.length})`}
        players={game.confirmed}
        game={game}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onTogglePaid={(userId, paid) => togglePaid.mutate({ userId, paid })}
        onRemove={(userId) => removePlayer.mutate(userId)}
        emptyText="Ninguém confirmou ainda. Manda o convite no grupo!"
      />

      {game.waitlist.length > 0 && (
        <PlayerList
          title={`Lista de espera (${game.waitlist.length})`}
          players={game.waitlist}
          game={game}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onTogglePaid={() => {}}
          onRemove={(userId) => removePlayer.mutate(userId)}
          hidePayment
        />
      )}

      {game.out.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink-500">
            Desistências ({game.out.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {game.out.map((player) => (
              <li
                key={player.userId}
                className="flex items-center gap-2 text-sm text-ink-400"
              >
                <Avatar name={player.name} className="h-7 w-7 bg-ink-400" />
                {player.name}
              </li>
            ))}
          </ul>
        </details>
      )}

      {showInvite && (
        <InviteSheet gameId={id} onClose={() => setShowInvite(false)} />
      )}
      {showAddPlayer && (
        <AddPlayerSheet
          gameId={id}
          taken={[...game.confirmed, ...game.waitlist].map((p) => p.userId)}
          onDone={invalidate}
          onClose={() => setShowAddPlayer(false)}
        />
      )}
    </div>
  );
}

function InfoLine({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 text-ink-600 dark:text-ink-300', className)}>
      <span className="mt-0.5 shrink-0 text-ink-400">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PlayerList({
  title,
  players,
  game,
  isAdmin,
  currentUserId,
  onTogglePaid,
  onRemove,
  hidePayment,
  emptyText,
}: {
  title: string;
  players: GamePlayer[];
  game: GameDetail;
  isAdmin: boolean;
  currentUserId?: string;
  onTogglePaid: (userId: string, paid: boolean) => void;
  onRemove: (userId: string) => void;
  hidePayment?: boolean;
  emptyText?: string;
}) {
  const showPayment = !hidePayment && game.cost > 0;

  return (
    <div className="card p-4">
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-400">
        {title}
      </h2>

      {players.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {players.map((player, index) => (
            <li key={player.userId} className="flex items-center gap-3 py-2.5">
              <span className="w-4 text-xs font-bold text-ink-300">{index + 1}</span>
              <Avatar name={player.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {player.name}
                  {player.userId === currentUserId && (
                    <span className="ml-1.5 text-xs font-normal text-brand-600">
                      você
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-400">
                  {POSITION_LABELS[player.position] ?? 'Sem posição fixa'}
                  {player.noShow && ' · faltou'}
                </p>
              </div>

              {showPayment &&
                (isAdmin ? (
                  <button
                    onClick={() => onTogglePaid(player.userId, !player.paid)}
                    className={cn(
                      'badge',
                      player.paid
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-ink-200 text-ink-500 dark:bg-ink-800 dark:text-ink-400',
                    )}
                  >
                    {player.paid ? (
                      <>
                        <Check className="h-3 w-3" /> pago
                      </>
                    ) : (
                      'marcar pago'
                    )}
                  </button>
                ) : (
                  player.paid && (
                    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="h-3 w-3" /> pago
                    </span>
                  )
                ))}

              {isAdmin && player.userId !== currentUserId && (
                <button
                  onClick={() => {
                    if (window.confirm(`Tirar ${player.name} da pelada?`)) {
                      onRemove(player.userId);
                    }
                  }}
                  className="text-ink-300 hover:text-red-600"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddPlayerSheet({
  gameId,
  taken,
  onDone,
  onClose,
}: {
  gameId: string;
  taken: string[];
  onDone: (game: GameDetail) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['community'],
    queryFn: () => api.get<User[]>('/users/community'),
  });

  const add = useMutation({
    mutationFn: (userId: string) =>
      api.post<GameDetail>(`/games/${gameId}/players/${userId}`),
    onSuccess: (game) => {
      onDone(game);
      onClose();
    },
  });

  const available = (users ?? [])
    .filter((u) => !taken.includes(u.id ?? String(u._id)))
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="animate-fade-up flex max-h-[80dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white p-5 dark:bg-ink-900 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Adicionar jogador</h2>
          <button onClick={onClose} className="rounded-full p-1 text-ink-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          className="input mb-3"
          placeholder="Buscar pelo nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : available.length === 0 ? (
          <EmptyState
            title="Ninguém disponível"
            description="Todo mundo aprovado já está nessa pelada."
          />
        ) : (
          <ul className="flex-1 divide-y divide-ink-100 overflow-auto dark:divide-ink-800">
            {available.map((person) => {
              const personId = person.id ?? String(person._id);
              return (
                <li key={personId} className="flex items-center gap-3 py-2.5">
                  <Avatar name={person.name} />
                  <span className="flex-1 truncate text-sm font-medium">
                    {person.name}
                  </span>
                  <button
                    onClick={() => add.mutate(personId)}
                    disabled={add.isPending}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Add
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Pequeno wrapper para não repetir onSuccess/onError em toda mutação. */
function useMutationSafe(
  fn: () => Promise<GameDetail>,
  onSuccess: (game: GameDetail) => void,
  onError: (message: string) => void,
) {
  return useMutation({
    mutationFn: fn,
    onSuccess: (game) => {
      onError('');
      onSuccess(game);
    },
    onError: (err: Error) => onError(err.message),
  });
}
