'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { brl } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar, EmptyState, PageLoader } from '@/components/ui';
import type { RankingRow } from '@/lib/types';

export default function RankingPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['ranking'],
    queryFn: () =>
      api.get<{ totalGames: number; ranking: RankingRow[] }>('/stats/ranking'),
  });

  if (isLoading) return <PageLoader />;

  const rows = (data?.ranking ?? []).filter(
    (row) => row.played > 0 || row.noShows > 0 || row.withdrawals > 0,
  );
  const top = rows[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="heading text-3xl">Ranking</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {data?.totalGames ?? 0} peladas já rolaram. Quem mais aparece fica no topo.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-10 w-10" strokeWidth={1.5} />}
          title="Ainda sem histórico"
          description="Depois da primeira pelada encerrada o ranking aparece aqui."
        />
      ) : (
        <>
          {/* Pódio do primeiro colocado */}
          {top && (
            <section className="panel relative overflow-hidden p-5">
              <div
                aria-hidden
                className="absolute -right-12 -top-12 h-40 w-40 rotate-12 bg-brand/10"
              />
              <p className="eyebrow relative text-brand">Mais presente</p>
              <p className="relative mt-1 heading text-display">{top.name}</p>
              <div className="relative mt-4 grid grid-cols-3 divide-x-2 divide-line border-y-2 border-line">
                <Stat label="Jogos" value={String(top.played)} />
                <Stat label="Presença" value={`${top.attendanceRate}%`} tone="go" />
                <Stat label="Faltas" value={String(top.noShows)} tone="stop" />
              </div>
            </section>
          )}

          <ol className="panel stagger divide-y-2 divide-line-soft">
            {rows.map((row, index) => {
              const isMe = row.userId === user?.id;
              return (
                <li
                  key={row.userId}
                  className={cn(
                    'flex items-center gap-3 p-3.5',
                    isMe && 'border-l-4 border-l-brand bg-brand/5',
                  )}
                >
                  <span
                    className={cn(
                      'w-8 text-center font-display text-xl font-bold',
                      index === 0 ? 'text-brand' : 'text-fg-dim',
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar name={row.name} tone={isMe ? 'brand' : 'court'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {row.name}
                      {isMe && (
                        <span className="ml-1.5 font-display text-[10px] uppercase tracking-wide text-brand">
                          você
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-fg-dim">
                      {row.played} {row.played === 1 ? 'jogo' : 'jogos'} ·{' '}
                      {row.attendanceRate}% de presença
                      {row.noShows > 0 && ` · ${row.noShows} falta(s)`}
                    </p>
                  </div>
                  {row.pendingAmount > 0 && (
                    <span className="badge-stop">deve {brl(row.pendingAmount)}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'fg',
}: {
  label: string;
  value: string;
  tone?: 'fg' | 'go' | 'stop';
}) {
  return (
    <div className="px-2 py-3 text-center">
      <p
        className={cn(
          'font-display text-2xl font-bold leading-none',
          tone === 'go' && 'text-go',
          tone === 'stop' && 'text-stop',
        )}
      >
        {value}
      </p>
      <p className="eyebrow mt-1.5">{label}</p>
    </div>
  );
}
