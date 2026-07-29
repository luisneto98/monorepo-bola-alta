'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { GameForm } from '@/components/game-form';
import { PageLoader } from '@/components/ui';
import type { GameDetail } from '@/lib/types';

export default function EditarPeladaPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, isLoading: loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !isAdmin) router.replace(`/peladas/${id}`);
  }, [isAdmin, loadingAuth, router, id]);

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', id],
    queryFn: () => api.get<GameDetail>(`/games/${id}`),
  });

  if (isLoading || loadingAuth || !game || !isAdmin) return <PageLoader />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Editar pelada
      </h1>
      <GameForm game={game} />
    </div>
  );
}
