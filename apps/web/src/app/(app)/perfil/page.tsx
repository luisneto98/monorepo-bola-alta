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
import { Avatar, ErrorText, PageLoader, Spinner } from '@/components/ui';
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
      setMessage('Perfil atualizado!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  const played = history?.filter((h) => h.status === 'CONFIRMED' && !h.noShow).length ?? 0;
  const pending = history?.filter(
    (h) => h.status === 'CONFIRMED' && !h.paid && h.gameStatus === 'FINISHED',
  ).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-4 p-5">
        <Avatar name={user.name} className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold leading-tight">
            {user.name}
          </h1>
          <p className="truncate text-sm text-ink-500 dark:text-ink-400">
            {user.email}
          </p>
          {user.role === 'ADMIN' && (
            <span className="badge mt-1 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              organizador
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Peladas jogadas" value={played} />
        <StatTile
          label="Pagamentos pendentes"
          value={pending}
          tone={pending > 0 ? 'warn' : 'ok'}
        />
      </div>

      {/* Notificações */}
      <div className="card flex items-center gap-3 p-4">
        <div className="flex-1">
          <p className="font-semibold">Avisos no celular</p>
          <p className="text-xs text-ink-500 dark:text-ink-400">
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
            className="btn-ghost px-3 py-2 text-xs"
          >
            {push.busy ? <Spinner /> : <BellOff className="h-4 w-4" />}
          </button>
        ) : (
          <button
            onClick={() => push.enable().catch((e) => setError(e.message))}
            disabled={push.busy || push.state !== 'off'}
            className="btn-primary px-3 py-2 text-xs"
          >
            {push.busy ? <Spinner /> : <Bell className="h-4 w-4" />}
            Ativar
          </button>
        )}
      </div>

      {/* Dados */}
      <form onSubmit={save} className="card space-y-4 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
          Meus dados
        </p>

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

        <div>
          <span className="label">Posição preferida</span>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => setForm({ ...form, position })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  form.position === position
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-ink-300 text-ink-500 dark:border-ink-700 dark:text-ink-400',
                )}
              >
                {POSITION_LABELS[position]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="level">
            Nível: {form.level}
          </label>
          <input
            id="level"
            type="range"
            min={1}
            max={5}
            step={1}
            className="w-full accent-brand-500"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
          />
          <div className="flex justify-between text-[11px] text-ink-400">
            <span>iniciante</span>
            <span>avançado</span>
          </div>
        </div>

        <ErrorText>{error}</ErrorText>
        {message && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {message}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner /> : 'Salvar'}
        </button>
      </form>

      {/* Histórico */}
      {history && history.length > 0 && (
        <div className="card p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">
            Meu histórico
          </p>
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {history.slice(0, 15).map((row) => (
              <li key={row.gameId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/peladas/${row.gameId}`}
                    className="block truncate text-sm font-medium"
                  >
                    {row.title}
                  </Link>
                  <p className="text-xs text-ink-400">{formatDay(row.date)}</p>
                </div>
                {row.status === 'OUT' ? (
                  <span className="badge bg-ink-200 text-ink-500 dark:bg-ink-800">
                    saiu
                  </span>
                ) : row.noShow ? (
                  <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    faltou
                  </span>
                ) : row.paid ? (
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    pago
                  </span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    a pagar
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={async () => {
          await logout();
          router.replace('/login');
        }}
        className="btn-ghost w-full text-red-600"
      >
        <LogOut className="h-4 w-4" /> Sair da conta
      </button>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = 'ok',
}: {
  label: string;
  value: number;
  tone?: 'ok' | 'warn';
}) {
  return (
    <div className="card p-4">
      <p
        className={cn(
          'font-display text-3xl font-extrabold',
          tone === 'warn' ? 'text-brand-600' : 'text-court-700 dark:text-court-400',
        )}
      >
        {value}
      </p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}
