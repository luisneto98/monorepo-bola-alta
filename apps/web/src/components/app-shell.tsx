'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { CalendarDays, ShieldCheck, Trophy, User as UserIcon } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/cn';
import { PageLoader } from './ui';

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

  if (isLoading || !user || user.status !== 'APPROVED') return <PageLoader />;

  const nav = isAdmin
    ? [...NAV, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
    : NAV;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-ink-50/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏐</span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              Bola Alta
            </span>
          </Link>
          <Link
            href="/perfil"
            className="text-sm font-medium text-ink-500 dark:text-ink-400"
          >
            {user.name.split(' ')[0]}
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/95">
        <div className="mx-auto flex w-full max-w-2xl">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition',
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-ink-400 dark:text-ink-500',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
