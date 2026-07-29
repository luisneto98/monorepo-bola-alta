'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ShieldCheck, Trophy, User as UserIcon } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/cn';
import { formatShortWeekday, formatTime } from '@/lib/format';
import { Marquee, PageLoader } from './ui';
import { Wordmark } from './logo';
import type { Game } from '@/lib/types';

const NAV = [
  { href: '/', label: 'Peladas', icon: CalendarDays },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/perfil', label: 'Perfil', icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (user.status !== 'APPROVED') router.replace('/aguardando');
  }, [user, isLoading, router]);

  const approved = !!user && user.status === 'APPROVED';

  // Alimenta a faixa rolante com as próximas peladas.
  const { data: upcoming } = useQuery({
    queryKey: ['games', 'upcoming'],
    queryFn: () => api.get<Game[]>('/games?scope=upcoming'),
    enabled: approved,
  });

  if (isLoading || !approved) return <PageLoader />;

  const nav = isAdmin
    ? [...NAV, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
    : NAV;

  const ticker = (upcoming ?? [])
    .filter((game) => game.status !== 'CANCELED')
    .slice(0, 4)
    .map(
      (game) =>
        `${formatShortWeekday(game.date)} ${formatTime(game.date)} · ${game.location.name} · ${
          game.status === 'CONFIRMED'
            ? `${game.spotsLeft} vaga${game.spotsLeft === 1 ? '' : 's'}`
            : `faltam ${game.missingToConfirm}`
        }`,
    );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col border-x-2 border-line/60">
      <header className="safe-top sticky top-0 z-20 border-b-2 border-line bg-canvas/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Início">
            <Wordmark />
          </Link>
          <Link
            href="/perfil"
            className="flex min-h-[44px] items-center gap-2 font-display text-xs font-bold uppercase tracking-wide text-fg-muted"
          >
            {user.name.split(' ')[0]}
            {isAdmin && <span className="bg-brand px-1.5 py-0.5 text-canvas">adm</span>}
          </Link>
        </div>
        {ticker.length > 0 && <Marquee items={ticker} />}
      </header>

      <main className="flex-1 px-4 pb-32 pt-5">{children}</main>

      <nav
        aria-label="Navegação principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-surface"
      >
        <div className="mx-auto flex w-full max-w-2xl">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 border-t-4 font-display text-[10px] font-bold uppercase tracking-[0.12em] transition-colors',
                  active
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-transparent text-fg-dim hover:text-fg-muted',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
