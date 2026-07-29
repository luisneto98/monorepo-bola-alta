'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { brl } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar, EmptyState, PageLoader } from '@/components/ui';
import type { RankingRow } from '@/lib/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['ranking'],
    queryFn: () => api.get<{ totalGames: number; ranking: RankingRow[] }>(
      '/stats/ranking',
    ),
  });

  if (isLoading) return <PageLoader />;

  const rows = (data?.ranking ?? []).filter(
    (row) => row.played > 0 || row.noShows > 0 || row.withdrawals > 0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">
          Ranking de presença
        </h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {data?.totalGames ?? 0} peladas já rolaram.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-10 w-10" />}
          title="Ainda sem histórico"
          description="Depois da primeira pelada encerrada o ranking aparece aqui."
        />
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-ink-800">
          {rows.map((row, index) => {
            const isMe = row.userId === user?.id;
            return (
              <div
                key={row.userId}
                className={cn(
                  'flex items-center gap-3 p-3.5',
                  isMe && 'bg-brand-50/70 dark:bg-brand-900/10',
                )}
              >
                <span className="w-7 text-center text-lg font-bold text-ink-400">
                  {MEDALS[index] ?? index + 1}
                </span>
                <Avatar name={row.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {row.name}
                    {isMe && (
                      <span className="ml-1.5 text-xs font-normal text-brand-600">
                        você
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-400">
                    {row.played} {row.played === 1 ? 'jogo' : 'jogos'} ·{' '}
                    {row.attendanceRate}% de presença
                    {row.noShows > 0 && ` · ${row.noShows} falta(s)`}
                  </p>
                </div>
                {row.pendingAmount > 0 && (
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    deve {brl(row.pendingAmount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
