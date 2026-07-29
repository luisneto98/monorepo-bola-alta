'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { AuthHero } from '@/components/auth-hero';
import { ErrorText, Spinner } from '@/components/ui';
import type { User } from '@/lib/types';

export default function CadastroPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const created = await api.post<User>('/auth/register', form);
      await refresh();
      router.replace(created.status === 'APPROVED' ? '/' : '/aguardando');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar.');
      setLoading(false);
    }
  }

  return (
    <AuthHero
      title="Entrar no time"
      subtitle="Depois do cadastro, um organizador libera seu acesso."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            required
            className="input"
            placeholder="Como a turma te chama"
            value={form.name}
            onChange={set('name')}
          />
        </div>

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="voce@email.com"
            value={form.email}
            onChange={set('email')}
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            WhatsApp <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            className="input"
            placeholder="(00) 90000-0000"
            value={form.phone}
            onChange={set('phone')}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="input"
            placeholder="mínimo 6 caracteres"
            value={form.password}
            onChange={set('password')}
          />
        </div>

        <ErrorText>{error}</ErrorText>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-ink-500 dark:text-ink-400">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-brand-600">
            Entrar
          </Link>
        </p>
      </form>
    </AuthHero>
  );
}
