'use client';

import Link from 'next/link';
import { MapPin, Users, Wallet } from 'lucide-react';

import {
  brl,
  formatDayNumber,
  formatMonth,
  formatRelative,
  formatShortWeekday,
  formatTime,
  perPlayer,
} from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Game } from '@/lib/types';
import {
  AttendanceBadge,
  GameStatusBadge,
  PlayersMeter,
  gameStatusBlock,
} from './ui';

/** Card no formato de ticket de jogo: bloco da data + corpo + medidor de vagas. */
export function GameCard({ game }: { game: Game }) {
  const canceled = game.status === 'CANCELED';
  const rate = perPlayer(game);

  return (
    <Link
      href={`/peladas/${game.id}`}
      className={cn(
        'panel group block transition-colors hover:border-brand',
        canceled && 'opacity-55',
      )}
    >
      <div className="flex">
        {/* Talão da data */}
        <div
          className={cn(
            'flex w-[76px] shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 border-line py-4',
            gameStatusBlock(game.status),
          )}
        >
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
            {formatShortWeekday(game.date)}
          </span>
          <span className="font-display text-4xl font-bold leading-none">
            {formatDayNumber(game.date)}
          </span>
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
            {formatMonth(game.date)}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="heading min-w-0 text-base leading-tight">{game.title}</h3>
            <GameStatusBadge status={game.status} />
          </div>

          <p className="font-display text-2xl font-bold leading-none">
            {formatTime(game.date)}
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-fg-dim">
              {formatRelative(game.date)}
            </span>
          </p>

          <div className="mt-2.5 space-y-1 text-sm text-fg-muted">
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-fg-dim" />
              {game.location.name}
            </p>
            {rate && (
              <p className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-fg-dim" />
                <span className="font-semibold text-fg">{brl(rate.value)}</span>
                <span>por pessoa{rate.estimated && ' (estimado)'}</span>
              </p>
            )}
          </div>

          {!canceled && (
            <div className="mt-3.5 space-y-2">
              <PlayersMeter
                confirmed={game.confirmedCount}
                min={game.minPlayers}
                max={game.maxPlayers}
              />
              <div className="flex items-center justify-between font-display text-[11px] font-bold uppercase tracking-[0.12em]">
                <span className="flex items-center gap-1.5 text-fg-muted">
                  <Users className="h-3.5 w-3.5" />
                  {game.confirmedCount}/{game.maxPlayers}
                  {game.waitlistCount > 0 && (
                    <span className="text-court">+{game.waitlistCount} espera</span>
                  )}
                </span>
                <span
                  className={cn(
                    game.status === 'CONFIRMED'
                      ? game.spotsLeft > 0
                        ? 'text-go'
                        : 'text-fg-dim'
                      : 'text-warn',
                  )}
                >
                  {game.status === 'CONFIRMED'
                    ? game.spotsLeft > 0
                      ? `${game.spotsLeft} ${game.spotsLeft === 1 ? 'vaga' : 'vagas'}`
                      : 'lotada'
                    : `faltam ${game.missingToConfirm}`}
                </span>
              </div>
            </div>
          )}

          {game.me.status && (
            <div className="mt-3">
              <AttendanceBadge status={game.me.status} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
