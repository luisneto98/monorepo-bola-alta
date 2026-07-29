'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Clock, LogOut, XCircle } from 'lucide-react';

import { useAuth } from '@/providers/auth-provider';
import { AuthHero } from '@/components/auth-hero';
import { PageLoader } from '@/components/ui';

export default function AguardandoPage() {
  const { user, isLoading, logout, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (user.status === 'APPROVED') router.replace('/');
  }, [user, isLoading, router]);

  if (isLoading || !user || user.status === 'APPROVED') return <PageLoader />;

  const rejected = user.status === 'REJECTED';

  return (
    <AuthHero
      title={rejected ? 'Acesso recusado' : 'Quase lá!'}
      subtitle={rejected ? 'Fale com um organizador.' : 'Falta a liberação do organizador.'}
    >
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          {rejected ? (
            <XCircle className="h-14 w-14 text-red-500" />
          ) : (
            <Clock className="h-14 w-14 text-brand-500" />
          )}
        </div>

        <p className="text-sm text-ink-600 dark:text-ink-300">
          {rejected
            ? 'Seu cadastro não foi aprovado. Se achar que foi engano, chame alguém da organização no WhatsApp.'
            : `Oi, ${user.name.split(' ')[0]}! Seu cadastro chegou e está esperando aprovação. Assim que liberarem, você já vê as peladas e confirma presença.`}
        </p>

        {!rejected && (
          <button onClick={() => refresh()} className="btn-primary w-full">
            Já fui aprovado, atualizar
          </button>
        )}

        <button
          onClick={async () => {
            await logout();
            router.replace('/login');
          }}
          className="btn-ghost w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </AuthHero>
  );
}
