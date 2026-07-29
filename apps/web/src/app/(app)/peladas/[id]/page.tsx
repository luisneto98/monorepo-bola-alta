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
import {
  brl,
  formatFull,
  formatTime,
  perPlayer,
  POSITION_LABELS,
} from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Avatar,
  EmptyState,
  ErrorText,
  PageLoader,
  PlayersMeter,
  SectionTitle,
  Spinner,
  gameStatusBlock,
  gameStatusLabel,
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
  const rate = perPlayer(game);

  return (
    <div className="space-y-4 pb-4">
      <button
        onClick={() => router.back()}
        className="flex min-h-[44px] items-center gap-1.5 font-display text-xs font-bold uppercase tracking-[0.14em] text-fg-dim hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Cabeçalho */}
      <div className="panel animate-rise-in">
        <div className={cn('border-b-2 border-line px-5 py-5', gameStatusBlock(game.status))}>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">
            {gameStatusLabel(game.status)}
          </p>
          <h1 className="heading mt-1 text-display">{game.title}</h1>
          <p className="mt-1 font-display text-sm font-bold uppercase tracking-wide opacity-85">
            {formatFull(game.date)}
          </p>
          {canceled && game.cancelReason && (
            <p className="mt-3 border-2 border-canvas/25 bg-canvas/20 px-3 py-2 text-sm">
              Motivo: {game.cancelReason}
            </p>
          )}
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoLine icon={<Clock className="h-4 w-4" />} label="Horário">
              {formatTime(game.date)} · {game.durationMinutes} min
            </InfoLine>
            <InfoLine icon={<Users className="h-4 w-4" />} label="Jogadores">
              mín. {game.minPlayers} · máx. {game.maxPlayers}
            </InfoLine>
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              label="Quadra"
              className="col-span-2"
            >
              {game.location.mapsUrl ? (
                <a
                  href={game.location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-court underline decoration-court/40 underline-offset-2"
                >
                  {game.location.name}
                </a>
              ) : (
                game.location.name
              )}
              {game.location.address && (
                <span className="block text-xs text-fg-dim">{game.location.address}</span>
              )}
            </InfoLine>
            {rate && (
              <InfoLine
                icon={<Wallet className="h-4 w-4" />}
                label={rate.estimated ? 'Rateio estimado' : 'Rateio'}
                className="col-span-2"
              >
                <span className="font-display text-xl font-bold text-brand">
                  {brl(rate.value)}
                </span>
                <span className="ml-1.5 text-fg-muted">por pessoa</span>
                <span className="block text-xs text-fg-dim">
                  quadra {brl(game.cost)} ÷{' '}
                  {rate.estimated
                    ? `${game.minPlayers} (o mínimo)`
                    : `${game.confirmedCount} confirmados`}
                  {game.confirmedCount < game.maxPlayers &&
                    ' — quanto mais gente, mais barato'}
                </span>
              </InfoLine>
            )}
          </div>

          {game.notes && (
            <p className="border-l-4 border-brand bg-surface-high px-3 py-2 text-sm text-fg-muted">
              {game.notes}
            </p>
          )}

          {!canceled && (
            <div className="space-y-2.5">
              <PlayersMeter
                confirmed={game.confirmedCount}
                min={game.minPlayers}
                max={game.maxPlayers}
              />
              <p className="text-sm text-fg-muted">
                {game.status === 'CONFIRMED' ? (
                  <>
                    <strong className="text-go">Pelada confirmada.</strong>{' '}
                    {game.spotsLeft > 0
                      ? `Ainda cabem ${game.spotsLeft}.`
                      : 'Vagas esgotadas — dá pra entrar na espera.'}
                  </>
                ) : (
                  <>
                    Faltam{' '}
                    <strong className="text-warn">{game.missingToConfirm}</strong>{' '}
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
                aria-label="Convite para o WhatsApp"
                className="btn-ghost px-4"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {game.me.status === 'WAITLIST' && game.me.waitlistPosition && (
            <p className="border-2 border-court/50 bg-court/10 px-3 py-2 text-center text-sm font-medium text-court">
              Você é o {game.me.waitlistPosition}º da espera — a gente te avisa se abrir
              vaga.
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
        <section className="panel space-y-3 p-4">
          <SectionTitle>Organizador</SectionTitle>

          {game.cost > 0 && (
            <div className="flex items-center justify-between border-2 border-line bg-canvas px-3 py-2.5">
              <span className="eyebrow">Caixa</span>
              <span className="font-display text-sm font-bold">
                {brl(game.totalPaid)} / {brl(game.cost)}
                <span
                  className={cn(
                    'ml-2',
                    game.paidCount === game.confirmedCount ? 'text-go' : 'text-warn',
                  )}
                >
                  {game.paidCount}/{game.confirmedCount} pagaram
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link href={`/peladas/${id}/editar`} className="btn-ghost text-xs">
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <button onClick={() => setShowAddPlayer(true)} className="btn-ghost text-xs">
              <UserPlus className="h-4 w-4" /> Add jogador
            </button>

            {!finished && !canceled && (
              <>
                <button
                  onClick={() => {
                    const reason = window.prompt('Motivo do cancelamento (opcional):');
                    if (reason !== null) cancelGame.mutate(reason);
                  }}
                  className="btn-danger text-xs"
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
              className="btn-danger col-span-2 text-xs"
            >
              <Trash2 className="h-4 w-4" /> Apagar pelada
            </button>
          </div>
        </section>
      )}

      {/* Listas */}
      <PlayerList
        title={`Confirmados · ${game.confirmed.length}`}
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
          title={`Lista de espera · ${game.waitlist.length}`}
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
        <details className="panel p-4">
          <summary className="eyebrow cursor-pointer">
            Desistências · {game.out.length}
          </summary>
          <ul className="mt-3 space-y-2">
            {game.out.map((player) => (
              <li key={player.userId} className="flex items-center gap-2.5 text-sm text-fg-dim">
                <Avatar name={player.name} tone="mute" className="h-7 w-7" />
                {player.name}
              </li>
            ))}
          </ul>
        </details>
      )}

      {showInvite && <InviteSheet gameId={id} onClose={() => setShowInvite(false)} />}
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
  label,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="eyebrow mb-1 flex items-center gap-1.5">
        <span className="text-fg-dim">{icon}</span>
        {label}
      </p>
      <div className="text-fg">{children}</div>
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
    <section className="panel p-4">
      <SectionTitle>{title}</SectionTitle>

      {players.length === 0 ? (
        <p className="py-5 text-center text-sm text-fg-dim">{emptyText}</p>
      ) : (
        <ul className="stagger divide-y-2 divide-line-soft">
          {players.map((player, index) => (
            <li key={player.userId} className="flex items-center gap-3 py-2.5">
              <span className="w-5 font-display text-sm font-bold text-fg-dim">
                {index + 1}
              </span>
              <Avatar
                name={player.name}
                tone={player.userId === currentUserId ? 'brand' : 'court'}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {player.name}
                  {player.userId === currentUserId && (
                    <span className="ml-1.5 font-display text-[10px] uppercase tracking-wide text-brand">
                      você
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-fg-dim">
                  {POSITION_LABELS[player.position] ?? 'Sem posição fixa'}
                  {player.noShow && ' · faltou'}
                </p>
              </div>

              {showPayment &&
                (isAdmin ? (
                  <button
                    onClick={() => onTogglePaid(player.userId, !player.paid)}
                    className={player.paid ? 'badge-go' : 'badge-mute'}
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
                    <span className="badge-go">
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
                  aria-label={`Remover ${player.name}`}
                  className="flex h-11 w-11 items-center justify-center text-fg-dim hover:text-stop"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
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
    <div
      role="dialog"
      aria-modal
      aria-label="Adicionar jogador"
      className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="panel safe-bottom flex max-h-[85dvh] w-full max-w-lg animate-slide-up flex-col p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading text-lg">Adicionar jogador</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center text-fg-dim hover:text-fg"
          >
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
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : available.length === 0 ? (
          <EmptyState
            title="Ninguém disponível"
            description="Todo mundo aprovado já está nessa pelada."
          />
        ) : (
          <ul className="flex-1 divide-y-2 divide-line-soft overflow-auto">
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
                    className="btn-primary min-h-[40px] px-3 py-2 text-xs"
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
