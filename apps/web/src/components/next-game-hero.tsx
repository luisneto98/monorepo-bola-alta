'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, MapPin, Share2, X } from 'lucide-react';

import { api } from '@/lib/api';
import { brl, formatFull, perPlayer } from '@/lib/format';
import { cn } from '@/lib/cn';
import { GameStatusBadge, PlayersMeter, Spinner } from './ui';
import { InviteSheet } from './invite-sheet';
import type { Game, GameDetail } from '@/lib/types';

/** Contagem regressiva até o apito inicial. */
function useCountdown(target: string) {
  const [left, setLeft] = useState<number>(() => +new Date(target) - Date.now());

  useEffect(() => {
    const id = setInterval(() => setLeft(+new Date(target) - Date.now()), 30_000);
    return () => clearInterval(id);
  }, [target]);

  if (left <= 0) return null;

  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);

  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

/**
 * Destaque da próxima pelada: placar grande, medidor de vagas e confirmação
 * em um toque — sem precisar abrir o detalhe.
 */
export function NextGameHero({ game }: { game: Game }) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const countdown = useCountdown(game.date);
  const rate = perPlayer(game);

  const refresh = (updated: GameDetail) => {
    queryClient.setQueryData(['game', game.id], updated);
    queryClient.invalidateQueries({ queryKey: ['games'] });
  };

  const join = useMutation({
    mutationFn: () => api.post<GameDetail>(`/games/${game.id}/join`),
    onSuccess: refresh,
  });

  const leave = useMutation({
    mutationFn: () => api.post<GameDetail>(`/games/${game.id}/leave`),
    onSuccess: refresh,
  });

  const isIn = game.me.status === 'CONFIRMED' || game.me.status === 'WAITLIST';
  const busy = join.isPending || leave.isPending;
  const canceled = game.status === 'CANCELED';

  return (
    <section className="panel relative overflow-hidden">
      {/* Bloco de cor atrás do placar */}
      <div
        aria-hidden
        className={cn(
          'absolute -right-14 -top-14 h-32 w-32 rotate-12',
          game.status === 'CONFIRMED' ? 'bg-go/15' : canceled ? 'bg-stop/15' : 'bg-brand/15',
        )}
      />

      <div className="relative p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="eyebrow text-brand">Próxima pelada</span>
          <GameStatusBadge status={game.status} />
        </div>

        <Link href={`/peladas/${game.id}`} className="block">
          <h2 className="heading text-display">{game.title}</h2>
        </Link>

        <p className="mt-2 text-sm text-fg-muted">{formatFull(game.date)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
          <MapPin className="h-4 w-4 text-fg-dim" />
          {game.location.name}
        </p>

        {/* Placar: contagem, rateio e vagas */}
        <dl className="mt-5 grid grid-cols-3 divide-x-2 divide-line border-y-2 border-line">
          <Stat label="Começa em" value={countdown ?? 'agora'} />
          <Stat
            label={rate?.estimated ? 'Por pessoa (est.)' : 'Por pessoa'}
            value={rate ? brl(rate.value) : '—'}
            tone="brand"
          />
          <Stat
            label={game.status === 'CONFIRMED' ? 'Vagas' : 'Faltam'}
            value={String(
              game.status === 'CONFIRMED' ? game.spotsLeft : game.missingToConfirm,
            )}
            tone={game.status === 'CONFIRMED' ? 'go' : 'warn'}
          />
        </dl>

        {!canceled && (
          <div className="mt-4 space-y-2">
            <PlayersMeter
              confirmed={game.confirmedCount}
              min={game.minPlayers}
              max={game.maxPlayers}
            />
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-fg-dim">
              {game.confirmedCount} de {game.maxPlayers} confirmados
              {game.waitlistCount > 0 && ` · ${game.waitlistCount} na espera`}
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {canceled ? (
            <Link href={`/peladas/${game.id}`} className="btn-ghost flex-1">
              Ver detalhes <ArrowRight className="h-4 w-4" />
            </Link>
          ) : isIn ? (
            <button
              onClick={() => leave.mutate()}
              disabled={busy}
              className="btn-ghost flex-1"
            >
              {busy ? <Spinner /> : <X className="h-4 w-4" />}
              {game.me.status === 'WAITLIST' ? 'Sair da espera' : 'Não vou'}
            </button>
          ) : (
            <button
              onClick={() => join.mutate()}
              disabled={busy}
              className="btn-primary flex-1"
            >
              {busy ? <Spinner /> : <Check className="h-4 w-4" />}
              {game.spotsLeft > 0 ? 'Eu vou' : 'Entrar na espera'}
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
      </div>

      {showInvite && (
        <InviteSheet gameId={game.id} onClose={() => setShowInvite(false)} />
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone = 'fg',
}: {
  label: string;
  value: string;
  tone?: 'fg' | 'brand' | 'go' | 'warn';
}) {
  return (
    <div className="px-2 py-3 text-center first:pl-0 last:pr-0">
      <dd
        className={cn(
          'font-display text-xl font-bold leading-none',
          tone === 'brand' && 'text-brand',
          tone === 'go' && 'text-go',
          tone === 'warn' && 'text-warn',
        )}
      >
        {value}
      </dd>
      <dt className="eyebrow mt-1.5">{label}</dt>
    </div>
  );
}
