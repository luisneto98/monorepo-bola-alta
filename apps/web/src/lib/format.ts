const TZ = 'America/Sao_Paulo';

export const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value ?? 0,
  );

const fmt = (date: string | Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...options }).format(
    new Date(date),
  );

export const formatDay = (date: string | Date) =>
  fmt(date, { day: '2-digit', month: '2-digit', year: '2-digit' });

export const formatTime = (date: string | Date) =>
  fmt(date, { hour: '2-digit', minute: '2-digit' });

export const formatWeekday = (date: string | Date) =>
  capitalize(fmt(date, { weekday: 'long' }));

export const formatShortWeekday = (date: string | Date) =>
  capitalize(fmt(date, { weekday: 'short' }).replace('.', ''));

export const formatFull = (date: string | Date) =>
  `${formatWeekday(date)}, ${formatDay(date)} às ${formatTime(date)}`;

export function formatRelative(date: string | Date) {
  const diffMs = new Date(date).getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);

  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days === -1) return 'ontem';
  if (days > 1 && days < 7) return `em ${days} dias`;
  if (days < 0) return `há ${Math.abs(days)} dias`;
  return formatDay(date);
}

/** Converte um Date local para o valor de um <input type="datetime-local">. */
export function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const POSITION_LABELS: Record<string, string> = {
  LEVANTADOR: 'Levantador(a)',
  PONTEIRO: 'Ponteiro(a)',
  OPOSTO: 'Oposto(a)',
  CENTRAL: 'Central',
  LIBERO: 'Líbero',
  INDEFINIDA: 'Sem posição fixa',
};
