'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { toDatetimeLocal } from '@/lib/format';
import { ErrorText, Spinner } from '@/components/ui';
import type { Game, GameDetail } from '@/lib/types';

interface FormState {
  title: string;
  date: string;
  durationMinutes: number;
  locationName: string;
  address: string;
  mapsUrl: string;
  minPlayers: number;
  maxPlayers: number;
  cost: number;
  notes: string;
}

function defaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(20, 0, 0, 0);
  return toDatetimeLocal(date);
}

function toFormState(game?: GameDetail): FormState {
  if (!game) {
    return {
      title: '',
      date: defaultDate(),
      durationMinutes: 120,
      locationName: '',
      address: '',
      mapsUrl: '',
      minPlayers: 12,
      maxPlayers: 18,
      cost: 0,
      notes: '',
    };
  }

  return {
    title: game.title,
    date: toDatetimeLocal(new Date(game.date)),
    durationMinutes: game.durationMinutes,
    locationName: game.location.name,
    address: game.location.address ?? '',
    mapsUrl: game.location.mapsUrl ?? '',
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    cost: game.cost,
    notes: game.notes ?? '',
  };
}

export function GameForm({ game }: { game?: GameDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>(() => toFormState(game));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set =
    <K extends keyof FormState>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = event.target.value;
      const value =
        typeof form[field] === 'number' ? (Number(raw) as FormState[K]) : (raw as FormState[K]);
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (form.maxPlayers < form.minPlayers) {
      setError('O máximo de jogadores não pode ser menor que o mínimo.');
      return;
    }

    setLoading(true);
    const payload = {
      title: form.title,
      // datetime-local vem no fuso do navegador; o backend guarda em UTC.
      date: new Date(form.date).toISOString(),
      durationMinutes: form.durationMinutes,
      location: {
        name: form.locationName,
        address: form.address || undefined,
        mapsUrl: form.mapsUrl || undefined,
      },
      minPlayers: form.minPlayers,
      maxPlayers: form.maxPlayers,
      cost: form.cost,
      notes: form.notes || undefined,
    };

    try {
      const saved = game
        ? await api.patch<Game>(`/games/${game.id}`, payload)
        : await api.post<Game>('/games', payload);

      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['game', saved.id] });
      router.replace(`/peladas/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="title">
            Nome da pelada
          </label>
          <input
            id="title"
            required
            className="input"
            placeholder="Pelada de quinta"
            value={form.title}
            onChange={set('title')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="date">
              Data e hora
            </label>
            <input
              id="date"
              type="datetime-local"
              required
              className="input"
              value={form.date}
              onChange={set('date')}
            />
          </div>
          <div>
            <label className="label" htmlFor="duration">
              Duração (min)
            </label>
            <input
              id="duration"
              type="number"
              min={30}
              step={15}
              className="input"
              value={form.durationMinutes}
              onChange={set('durationMinutes')}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="locationName">
            Quadra
          </label>
          <input
            id="locationName"
            required
            className="input"
            placeholder="Ginásio Central"
            value={form.locationName}
            onChange={set('locationName')}
          />
        </div>
        <div>
          <label className="label" htmlFor="address">
            Endereço <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <input
            id="address"
            className="input"
            placeholder="Rua da Quadra, 100"
            value={form.address}
            onChange={set('address')}
          />
        </div>
        <div>
          <label className="label" htmlFor="mapsUrl">
            Link do mapa <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <input
            id="mapsUrl"
            type="url"
            className="input"
            placeholder="https://maps.app.goo.gl/..."
            value={form.mapsUrl}
            onChange={set('mapsUrl')}
          />
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="minPlayers">
              Mínimo p/ confirmar
            </label>
            <input
              id="minPlayers"
              type="number"
              min={2}
              className="input"
              value={form.minPlayers}
              onChange={set('minPlayers')}
            />
          </div>
          <div>
            <label className="label" htmlFor="maxPlayers">
              Máximo de vagas
            </label>
            <input
              id="maxPlayers"
              type="number"
              min={2}
              className="input"
              value={form.maxPlayers}
              onChange={set('maxPlayers')}
            />
          </div>
        </div>
        <p className="text-xs text-ink-400">
          Vôlei de quadra: 12 é o mínimo natural (dois times de 6). Acima do máximo,
          quem confirmar entra na lista de espera.
        </p>

        <div>
          <label className="label" htmlFor="cost">
            Custo total da quadra (R$)
          </label>
          <input
            id="cost"
            type="number"
            min={0}
            step="0.01"
            className="input"
            value={form.cost}
            onChange={set('cost')}
          />
          <p className="mt-1 text-xs text-ink-400">
            O valor por pessoa é o custo dividido pelos confirmados — recalcula
            sozinho conforme a galera confirma.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Observações <span className="font-normal text-ink-400">(opcional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            className="input"
            placeholder="Levar bola, camisa clara..."
            value={form.notes}
            onChange={set('notes')}
          />
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost flex-1"
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? <Spinner /> : game ? 'Salvar' : 'Marcar pelada'}
        </button>
      </div>
    </form>
  );
}
