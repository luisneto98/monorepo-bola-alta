'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Plus } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { GameCard } from '@/components/game-card';
import { NextGameHero } from '@/components/next-game-hero';
import { InstallBanner } from '@/components/install-prompt';
import { EmptyState, PageLoader, SectionTitle } from '@/components/ui';
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

  const isUpcoming = scope === 'upcoming';
  // Na aba de próximas, a primeira vira destaque e sai da lista.
  const [hero, ...rest] = isUpcoming ? (games ?? []) : [];
  const list = isUpcoming ? rest : (games ?? []);

  return (
    <div className="space-y-5">
      <InstallBanner />

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="heading text-3xl">Peladas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Confirme presença e chame a turma.
          </p>
        </div>
        {isAdmin && (
          <Link href="/peladas/nova" className="btn-primary px-3 py-2 text-xs">
            <Plus className="h-4 w-4" />
            Nova
          </Link>
        )}
      </div>

      <div className="flex border-2 border-line">
        {(
          [
            ['upcoming', 'Próximas'],
            ['past', 'Já rolaram'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setScope(value)}
            aria-pressed={scope === value}
            className={cn(
              'min-h-[44px] flex-1 font-display text-xs font-bold uppercase tracking-[0.14em] transition-colors',
              scope === value
                ? 'bg-brand text-canvas'
                : 'bg-transparent text-fg-dim hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : games?.length ? (
        <div className="space-y-5">
          {hero && <NextGameHero game={hero} />}

          {list.length > 0 && (
            <section>
              <SectionTitle>
                {isUpcoming ? 'Também marcadas' : `${list.length} no histórico`}
              </SectionTitle>
              <div className="stagger space-y-3">
                {list.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-10 w-10" strokeWidth={1.5} />}
          title={isUpcoming ? 'Nenhuma pelada marcada' : 'Nada no histórico ainda'}
          description={
            isUpcoming
              ? isAdmin
                ? 'Marque a próxima e chame a turma no WhatsApp.'
                : 'Assim que o organizador marcar, aparece aqui.'
              : 'As peladas que já aconteceram vão ficar aqui.'
          }
          action={
            isAdmin && isUpcoming ? (
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
