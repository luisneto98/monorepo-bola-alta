'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.get<User>('/auth/me');
      } catch (error) {
        // 401/403 aqui é só "não logado" — não é erro de verdade.
        if (error instanceof ApiError) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const value: AuthContextValue = {
    user: data ?? null,
    isLoading,
    isAdmin: data?.role === 'ADMIN',
    refresh: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    logout: async () => {
      await api.post('/auth/logout');
      queryClient.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
