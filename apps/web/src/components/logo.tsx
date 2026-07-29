import { Volleyball } from 'lucide-react';

import { cn } from '@/lib/cn';

/** Bola de vôlei (Lucide) — nada de emoji como ícone de UI. */
export function VolleyballIcon({ className }: { className?: string }) {
  return <Volleyball className={cn('h-6 w-6', className)} strokeWidth={2} aria-hidden />;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex h-9 w-9 items-center justify-center bg-brand text-canvas">
        <VolleyballIcon className="h-5 w-5" />
      </span>
      <span className="heading text-lg leading-none">
        Bola<span className="text-brand">Alta</span>
      </span>
    </span>
  );
}
