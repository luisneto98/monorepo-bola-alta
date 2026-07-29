import type { ReactNode } from 'react';

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
    <div className="relative min-h-dvh overflow-hidden bg-court-800">
      {/* Linhas de quadra ao fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div
        aria-hidden
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-7 text-center text-white">
          <div className="mb-3 text-5xl">🏐</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/70">{subtitle}</p>
        </div>

        <div className="animate-fade-up rounded-3xl bg-white p-6 shadow-2xl dark:bg-ink-900">
          {children}
        </div>
      </div>
    </div>
  );
}
