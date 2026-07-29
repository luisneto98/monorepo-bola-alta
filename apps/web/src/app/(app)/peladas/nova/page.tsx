'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { GameForm } from '@/components/game-form';
import { PageLoader } from '@/components/ui';

export default function NovaPeladaPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/');
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) return <PageLoader />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Nova pelada
      </h1>
      <GameForm />
    </div>
  );
}
