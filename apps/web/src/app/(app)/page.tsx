'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Plus } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { GameCard } from '@/components/game-card';
import { EmptyState, PageLoader } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Game } from '@/lib/types';

type Scope = 'upcoming' | 'past';

export default function PeladasPage() {
  const { isAdmin } = useAuth();
  const [scope, setScope] = useState<Scope>('upcoming');

  const { data: games, isLoading } = useQuery({
    queryKey: ['games', scope],
    queryFn: () => api.get<Game[]>(`/games?scope=${scope}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Peladas
        </h1>
        {isAdmin && (
          <Link href="/peladas/nova" className="btn-primary px-3 py-2 text-xs">
            <Plus className="h-4 w-4" />
            Nova
          </Link>
        )}
      </div>

      <div className="flex gap-1 rounded-xl bg-ink-200/70 p-1 dark:bg-ink-800/70">
        {(
          [
            ['upcoming', 'Próximas'],
            ['past', 'Já rolaram'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-semibold transition',
              scope === value
                ? 'bg-white text-ink-900 shadow-sm dark:bg-ink-900 dark:text-white'
                : 'text-ink-500 dark:text-ink-400',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : games?.length ? (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" />}
          title={scope === 'upcoming' ? 'Nenhuma pelada marcada' : 'Nada no histórico ainda'}
          description={
            scope === 'upcoming'
              ? isAdmin
                ? 'Marque a próxima e chame a turma no WhatsApp.'
                : 'Assim que o organizador marcar, aparece aqui.'
              : 'As peladas que já aconteceram vão ficar aqui.'
          }
          action={
            isAdmin && scope === 'upcoming' ? (
              <Link href="/peladas/nova" className="btn-primary">
                <Plus className="h-4 w-4" />
                Marcar pelada
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
