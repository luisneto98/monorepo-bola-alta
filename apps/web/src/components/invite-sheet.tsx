'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Copy, MessageCircle, X } from 'lucide-react';

import { api } from '@/lib/api';
import { Spinner } from './ui';

export function InviteSheet({
  gameId,
  onClose,
}: {
  gameId: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invite', gameId],
    queryFn: () => api.get<{ message: string }>(`/games/${gameId}/invite`),
  });

  const message = data?.message ?? '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Fallback para navegadores sem permissão de clipboard.
      const area = document.createElement('textarea');
      area.value = message;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="animate-fade-up flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white p-5 dark:bg-ink-900 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Convite para o WhatsApp</h2>
          <button onClick={onClose} className="rounded-full p-1 text-ink-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
            <pre className="mb-4 flex-1 overflow-auto whitespace-pre-wrap rounded-2xl bg-ink-100 p-4 font-sans text-sm leading-relaxed text-ink-800 dark:bg-ink-950 dark:text-ink-200">
              {message}
            </pre>

            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copiar
                  </>
                )}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="btn flex-1 bg-[#25D366] text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
