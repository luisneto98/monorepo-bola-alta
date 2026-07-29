'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellOff, LogOut } from 'lucide-react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { usePush } from '@/hooks/use-push';
import { formatDay, POSITION_LABELS } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  Avatar,
  ErrorText,
  PageLoader,
  SectionTitle,
  Spinner,
  SuccessText,
} from '@/components/ui';
import type { HistoryRow, PlayerPosition } from '@/lib/types';

const POSITIONS: PlayerPosition[] = [
  'LEVANTADOR',
  'PONTEIRO',
  'OPOSTO',
  'CENTRAL',
  'LIBERO',
  'INDEFINIDA',
];

export default function PerfilPage() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();
  const push = usePush();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    position: (user?.position ?? 'INDEFINIDA') as PlayerPosition,
    level: user?.level ?? 3,
  });

  const { data: history } = useQuery({
    queryKey: ['my-history'],
    queryFn: () => api.get<HistoryRow[]>('/stats/me'),
  });

  if (!user) return <PageLoader />;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.patch('/users/me', form);
      await refresh();
      setMessage('Perfil atualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  const played =
    history?.filter((h) => h.status === 'CONFIRMED' && !h.noShow).length ?? 0;
  const pending =
    history?.filter(
      (h) => h.status === 'CONFIRMED' && !h.paid && h.gameStatus === 'FINISHED',
    ).length ?? 0;

  return (
    <div className="space-y-4">
      <section className="panel flex items-center gap-4 p-5">
        <Avatar name={user.name} tone="brand" className="h-16 w-16 text-lg" />
        <div className="min-w-0">
          <h1 className="heading text-xl leading-tight">{user.name}</h1>
          <p className="truncate text-sm text-fg-muted">{user.email}</p>
          {user.role === 'ADMIN' && (
            <span className="badge mt-1.5 border-brand/60 bg-brand/15 text-brand">
              organizador
            </span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Peladas jogadas" value={played} />
        <StatTile
          label="A pagar"
          value={pending}
          tone={pending > 0 ? 'warn' : 'go'}
        />
      </div>

      {/* Notificações */}
      <section className="panel flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="heading text-sm">Avisos no celular</p>
          <p className="mt-1 text-xs text-fg-muted">
            {push.state === 'on'
              ? 'Você recebe aviso de pelada nova, confirmação e vaga liberada.'
              : push.state === 'denied'
                ? 'Você bloqueou as notificações nas configurações do navegador.'
                : push.state === 'unsupported'
                  ? 'Este navegador não suporta notificações. Instale o app na tela inicial.'
                  : 'Ative para não perder pelada nem vaga na lista de espera.'}
          </p>
        </div>
        {push.state === 'on' ? (
          <button
            onClick={() => push.disable()}
            disabled={push.busy}
            aria-label="Desativar notificações"
            className="btn-ghost px-4"
          >
            {push.busy ? <Spinner /> : <BellOff className="h-4 w-4" />}
          </button>
        ) : (
          <button
            onClick={() => push.enable().catch((e) => setError(e.message))}
            disabled={push.busy || push.state !== 'off'}
            className="btn-primary px-4 text-xs"
          >
            {push.busy ? <Spinner /> : <Bell className="h-4 w-4" />}
            Ativar
          </button>
        )}
      </section>

      {/* Dados */}
      <form onSubmit={save} className="panel space-y-5 p-4">
        <SectionTitle>Meus dados</SectionTitle>

        <div>
          <label className="label" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="(00) 90000-0000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <fieldset>
          <legend className="label">Posição preferida</legend>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => setForm({ ...form, position })}
                aria-pressed={form.position === position}
                className={cn(
                  'min-h-[44px] border-2 px-3 py-2 font-display text-[11px] font-bold uppercase tracking-wide transition-colors',
                  form.position === position
                    ? 'border-brand bg-brand text-canvas'
                    : 'border-line text-fg-muted hover:border-fg-dim',
                )}
              >
                {POSITION_LABELS[position]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="label" htmlFor="level">
            Nível — {form.level}/5
          </label>
          <input
            id="level"
            type="range"
            min={1}
            max={5}
            step={1}
            className="w-full accent-brand"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
          />
          <div className="flex justify-between text-[11px] text-fg-dim">
            <span>iniciante</span>
            <span>avançado</span>
          </div>
        </div>

        <ErrorText>{error}</ErrorText>
        <SuccessText>{message}</SuccessText>

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner /> : 'Salvar'}
        </button>
      </form>

      {/* Histórico */}
      {history && history.length > 0 && (
        <section className="panel p-4">
          <SectionTitle>Meu histórico</SectionTitle>
          <ul className="divide-y-2 divide-line-soft">
            {history.slice(0, 15).map((row) => (
              <li key={row.gameId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/peladas/${row.gameId}`}
                    className="block truncate text-sm font-medium hover:text-brand"
                  >
                    {row.title}
                  </Link>
                  <p className="text-xs text-fg-dim">{formatDay(row.date)}</p>
                </div>
                {row.status === 'OUT' ? (
                  <span className="badge-mute">saiu</span>
                ) : row.noShow ? (
                  <span className="badge-stop">faltou</span>
                ) : row.paid ? (
                  <span className="badge-go">pago</span>
                ) : (
                  <span className="badge-warn">a pagar</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <button
        onClick={async () => {
          await logout();
          router.replace('/login');
        }}
        className="btn-danger w-full"
      >
        <LogOut className="h-4 w-4" /> Sair da conta
      </button>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = 'go',
}: {
  label: string;
  value: number;
  tone?: 'go' | 'warn';
}) {
  return (
    <div className="panel p-4">
      <p
        className={cn(
          'font-display text-4xl font-bold leading-none',
          tone === 'warn' ? 'text-warn' : 'text-fg',
        )}
      >
        {value}
      </p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}
