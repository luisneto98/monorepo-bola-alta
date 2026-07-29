import type { ReactNode } from 'react';

import { VolleyballMark } from './logo';

export function AuthHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas">
      {/* Bloco diagonal de quadra */}
      <div
        aria-hidden
        className="absolute -left-24 -top-32 h-80 w-[140%] -rotate-6 border-y-2 border-line bg-court/10"
      />
      <div aria-hidden className="absolute -right-10 top-24 h-40 w-40 rotate-12 bg-brand/15" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
        <div className="mb-8">
          <VolleyballMark className="mb-5 h-16 w-16" />
          <h1 className="heading text-display">{title}</h1>
          <p className="mt-2 max-w-xs text-sm text-fg-muted">{subtitle}</p>
        </div>

        <div className="panel animate-rise-in p-6">{children}</div>
      </div>
    </div>
  );
}
