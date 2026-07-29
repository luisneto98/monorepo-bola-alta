'use client';

import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import type { GameStatus, AttendanceStatus } from '@/lib/types';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-ink-400">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && <div className="text-ink-300 dark:text-ink-600">{icon}</div>}
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
      {children}
    </p>
  );
}

const GAME_STATUS_STYLES: Record<GameStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Aguardando gente',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  CANCELED: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  FINISHED: {
    label: 'Encerrada',
    className: 'bg-ink-200 text-ink-700 dark:bg-ink-800 dark:text-ink-300',
  },
};

export function GameStatusBadge({ status }: { status: GameStatus }) {
  const { label, className } = GAME_STATUS_STYLES[status];
  return <span className={cn('badge', className)}>{label}</span>;
}

const ATTENDANCE_STYLES: Record<AttendanceStatus, { label: string; className: string }> =
  {
    CONFIRMED: {
      label: 'Você está dentro',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    WAITLIST: {
      label: 'Lista de espera',
      className: 'bg-court-100 text-court-800 dark:bg-court-950 dark:text-court-300',
    },
    OUT: {
      label: 'Você saiu',
      className: 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-400',
    },
  };

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const { label, className } = ATTENDANCE_STYLES[status];
  return <span className={cn('badge', className)}>{label}</span>;
}

/** Barra de progresso: mínimo (confirmação) e máximo (vagas). */
export function PlayersProgress({
  confirmed,
  min,
  max,
}: {
  confirmed: number;
  min: number;
  max: number;
}) {
  const pct = Math.min(100, (confirmed / max) * 100);
  const minPct = Math.min(100, (min / max) * 100);
  const reachedMin = confirmed >= min;

  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          reachedMin ? 'bg-emerald-500' : 'bg-brand-500',
        )}
        style={{ width: `${pct}%` }}
      />
      {/* Marca do mínimo para confirmar */}
      <div
        className="absolute inset-y-0 w-0.5 bg-ink-900/40 dark:bg-white/50"
        style={{ left: `${minPct}%` }}
        title={`Mínimo: ${min}`}
      />
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-court-700 text-xs font-bold text-white',
        className,
      )}
    >
      {initials || '?'}
    </div>
  );
}
