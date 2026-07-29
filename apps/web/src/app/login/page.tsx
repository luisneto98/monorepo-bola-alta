'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { AuthHero } from '@/components/auth-hero';
import { ErrorText, Spinner } from '@/components/ui';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(user.status === 'APPROVED' ? '/' : '/aguardando');
  }, [user, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const logged = await api.post<User>('/auth/login', { email, password });
      await refresh();
      router.replace(logged.status === 'APPROVED' ? '/' : '/aguardando');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      setLoading(false);
    }
  }

  return (
    <AuthHero title="Bola Alta" subtitle="A pelada da turma, organizada.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <ErrorText>{error}</ErrorText>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner /> : 'Entrar'}
        </button>

        <p className="text-center text-sm text-fg-muted">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold text-brand">
            Cadastre-se
          </Link>
        </p>
      </form>
    </AuthHero>
  );
}
