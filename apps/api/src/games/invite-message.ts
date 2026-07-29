import { GameStatus } from './schemas/game.schema';
import { AttendanceStatus } from './schemas/attendance.schema';

interface PlayerLine {
  name: string;
  status: AttendanceStatus;
  paid: boolean;
}

interface InviteInput {
  game: {
    title: string;
    date: Date;
    durationMinutes: number;
    location: { name: string; address?: string; mapsUrl?: string };
    minPlayers: number;
    maxPlayers: number;
    cost: number;
    status: GameStatus;
    notes?: string;
  };
  confirmed: PlayerLine[];
  waitlist: PlayerLine[];
  costPerPlayer: number;
  url: string;
}

const TZ = process.env.APP_TIMEZONE ?? 'America/Sao_Paulo';

const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  );

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...options }).format(
    new Date(date),
  );

/**
 * Monta o texto do convite para colar no WhatsApp.
 * Emojis e quebras de linha simples — o WhatsApp não entende markdown.
 */
export function buildInviteMessage(input: InviteInput): string {
  const { game, confirmed, waitlist, costPerPlayer, url } = input;

  const weekday = fmt(game.date, { weekday: 'long' });
  const day = fmt(game.date, { day: '2-digit', month: '2-digit' });
  const time = fmt(game.date, { hour: '2-digit', minute: '2-digit' });

  const endsAt = new Date(
    new Date(game.date).getTime() + game.durationMinutes * 60_000,
  );
  const endTime = fmt(endsAt, { hour: '2-digit', minute: '2-digit' });

  const spotsLeft = Math.max(0, game.maxPlayers - confirmed.length);
  const missing = Math.max(0, game.minPlayers - confirmed.length);

  const lines: string[] = [];

  lines.push(`🏐 *${game.title}*`);
  lines.push('');
  lines.push(`📅 ${capitalize(weekday)}, ${day}`);
  lines.push(`⏰ ${time} às ${endTime}`);
  lines.push(`📍 ${game.location.name}`);
  if (game.location.address) lines.push(`   ${game.location.address}`);
  if (game.location.mapsUrl) lines.push(`   ${game.location.mapsUrl}`);
  lines.push('');

  if (game.status === GameStatus.CANCELED) {
    lines.push('❌ *PELADA CANCELADA*');
    lines.push('');
  } else if (game.status === GameStatus.CONFIRMED) {
    lines.push(`✅ *Confirmada!* (${confirmed.length}/${game.maxPlayers})`);
  } else {
    lines.push(
      `⏳ Faltam *${missing}* ${missing === 1 ? 'pessoa' : 'pessoas'} para confirmar (${confirmed.length}/${game.minPlayers})`,
    );
  }

  if (spotsLeft > 0 && game.status !== GameStatus.CANCELED) {
    lines.push(`🎟️ ${spotsLeft} ${spotsLeft === 1 ? 'vaga' : 'vagas'} restando`);
  } else if (game.status !== GameStatus.CANCELED) {
    lines.push('🎟️ Vagas esgotadas — entra na lista de espera');
  }

  if (game.cost > 0) {
    lines.push('');
    lines.push(
      `💰 ${brl(costPerPlayer)} por pessoa (quadra ${brl(game.cost)} ÷ ${confirmed.length || game.minPlayers})`,
    );
    if (confirmed.length < game.maxPlayers) {
      lines.push('   _quanto mais gente, mais barato_');
    }
  }

  if (confirmed.length) {
    lines.push('');
    lines.push(`*Confirmados (${confirmed.length})*`);
    confirmed.forEach((p, i) => lines.push(`${i + 1}. ${p.name}`));
  }

  if (waitlist.length) {
    lines.push('');
    lines.push(`*Lista de espera (${waitlist.length})*`);
    waitlist.forEach((p, i) => lines.push(`${i + 1}. ${p.name}`));
  }

  if (game.notes) {
    lines.push('');
    lines.push(`📝 ${game.notes}`);
  }

  lines.push('');
  lines.push('👉 Confirme sua presença:');
  lines.push(url);

  return lines.join('\n');
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
