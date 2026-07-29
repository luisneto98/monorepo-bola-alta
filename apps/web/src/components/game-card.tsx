'use client';

import Link from 'next/link';
import { Clock, MapPin, Users, Wallet } from 'lucide-react';

import { brl, formatDay, formatRelative, formatShortWeekday, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Game } from '@/lib/types';
import { AttendanceBadge, GameStatusBadge, PlayersProgress } from './ui';

export function GameCard({ game }: { game: Game }) {
  const canceled = game.status === 'CANCELED';

  return (
    <Link
      href={`/peladas/${game.id}`}
      className={cn(
        'card block animate-fade-up overflow-hidden transition active:scale-[.99]',
        canceled && 'opacity-60',
      )}
    >
      <div className="flex">
        {/* Faixa da data */}
        <div
          className={cn(
            'flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 py-5 text-white',
            canceled ? 'bg-ink-400' : game.status === 'CONFIRMED' ? 'bg-emerald-600' : 'bg-court-700',
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {formatShortWeekday(game.date)}
          </span>
          <span className="font-display text-2xl font-extrabold leading-none">
            {formatDay(game.date).slice(0, 5)}
          </span>
          <span className="text-[11px] opacity-80">{formatRelative(game.date)}</span>
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold leading-tight">
              {game.title}
            </h3>
            <GameStatusBadge status={game.status} />
          </div>

          <div className="space-y-1 text-sm text-ink-500 dark:text-ink-400">
            <p className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatTime(game.date)}
            </p>
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {game.location.name}
            </p>
            {game.cost > 0 && (
              <p className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                {game.confirmedCount > 0
                  ? `${brl(game.costPerPlayer)} por pessoa`
                  : `${brl(game.cost)} a quadra`}
              </p>
            )}
          </div>

          {!canceled && (
            <div className="mt-3 space-y-1.5">
              <PlayersProgress
                confirmed={game.confirmedCount}
                min={game.minPlayers}
                max={game.maxPlayers}
              />
              <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {game.confirmedCount}/{game.maxPlayers}
                  {game.waitlistCount > 0 && ` (+${game.waitlistCount} na espera)`}
                </span>
                <span>
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
