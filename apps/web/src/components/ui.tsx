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
    <div className="flex min-h-[50vh] items-center justify-center text-fg-dim">
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
    <div className="panel flex flex-col items-center gap-4 px-6 py-12 text-center">
      {icon && <div className="text-line">{icon}</div>}
      <div>
        <p className="heading text-lg">{title}</p>
        {description && (
          <p className="mt-1.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="border-2 border-stop/60 bg-stop/10 px-3 py-2 text-sm font-medium text-stop"
    >
      {children}
    </p>
  );
}

export function SuccessText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="border-2 border-go/60 bg-go/10 px-3 py-2 text-sm font-medium text-go">
      {children}
    </p>
  );
}

/** Rótulo de seção no estilo placar. */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="eyebrow">{children}</h2>
      {action}
    </div>
  );
}

const GAME_STATUS: Record<
  GameStatus,
  { label: string; badge: string; block: string }
> = {
  PENDING: {
    label: 'Falta gente',
    badge: 'badge-warn',
    block: 'bg-warn text-canvas',
  },
  CONFIRMED: {
    label: 'Confirmada',
    badge: 'badge-go',
    block: 'bg-go text-canvas',
  },
  CANCELED: {
    label: 'Cancelada',
    badge: 'badge-stop',
    block: 'bg-stop text-canvas',
  },
  FINISHED: {
    label: 'Encerrada',
    badge: 'badge-mute',
    block: 'bg-line text-fg',
  },
};

export const gameStatusBlock = (status: GameStatus) => GAME_STATUS[status].block;
export const gameStatusLabel = (status: GameStatus) => GAME_STATUS[status].label;

export function GameStatusBadge({ status }: { status: GameStatus }) {
  const { label, badge } = GAME_STATUS[status];
  return <span className={badge}>{label}</span>;
}

const ATTENDANCE: Record<AttendanceStatus, { label: string; badge: string }> = {
  CONFIRMED: { label: 'Você está dentro', badge: 'badge-go' },
  WAITLIST: { label: 'Na espera', badge: 'badge-court' },
  OUT: { label: 'Você saiu', badge: 'badge-mute' },
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const { label, badge } = ATTENDANCE[status];
  return <span className={badge}>{label}</span>;
}

/**
 * Medidor de vagas segmentado: um bloco por vaga.
 * Preenchido = confirmado, tracejado = livre, e uma marca no mínimo para
 * confirmar. Dá pra contar as vagas de relance — que é o que a pessoa quer saber.
 */
export function PlayersMeter({
  confirmed,
  min,
  max,
  className,
}: {
  confirmed: number;
  min: number;
  max: number;
  className?: string;
}) {
  const slots = Math.min(max, 24);
  const reachedMin = confirmed >= min;

  return (
    <div
      className={cn('flex gap-[3px]', className)}
      role="img"
      aria-label={`${confirmed} de ${max} vagas preenchidas, mínimo de ${min}`}
    >
      {Array.from({ length: slots }, (_, index) => {
        const filled = index < confirmed;
        const isMinMark = index === min - 1;

        return (
          <span
            key={index}
            className={cn(
              'h-3 flex-1 border transition-colors duration-200',
              filled
                ? reachedMin
                  ? 'border-go bg-go'
                  : 'border-brand bg-brand'
                : 'border-dashed border-line bg-transparent',
              // Marca do mínimo: risquinho embaixo do bloco.
              isMinMark && 'relative after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:bg-fg-dim',
            )}
          />
        );
      })}
    </div>
  );
}

export function Avatar({
  name,
  className,
  tone = 'court',
}: {
  name: string;
  className?: string;
  tone?: 'court' | 'brand' | 'mute';
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      aria-hidden
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center border-2 font-display text-[11px] font-bold',
        tone === 'court' && 'border-court/60 bg-court/15 text-court',
        tone === 'brand' && 'border-brand/60 bg-brand/15 text-brand',
        tone === 'mute' && 'border-line bg-surface-high text-fg-dim',
        className,
      )}
    >
      {initials || '?'}
    </div>
  );
}

/** Faixa rolante do topo — a "chamada do ginásio". */
export function Marquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y-2 border-line bg-surface py-1.5">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {loop.map((item, index) => (
          <span
            key={index}
            className="flex items-center gap-8 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-fg-muted"
          >
            {item}
            <span aria-hidden className="h-1.5 w-1.5 bg-brand" />
          </span>
        ))}
      </div>
    </div>
  );
}
