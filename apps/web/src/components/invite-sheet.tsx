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
    <div
      role="dialog"
      aria-modal
      aria-label="Convite para o WhatsApp"
      className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="panel safe-bottom flex max-h-[88dvh] w-full max-w-lg animate-slide-up flex-col p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading text-lg">Convite pro grupo</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center text-fg-dim hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <pre className="mb-4 flex-1 overflow-auto whitespace-pre-wrap border-2 border-line bg-canvas p-4 font-sans text-sm leading-relaxed text-fg-muted">
              {message}
            </pre>

            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost flex-1">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-go" /> Copiado
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
                className="btn flex-1 border-go bg-go text-canvas hover:bg-go/80"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
