import { cn } from '@/lib/cn';

/**
 * Bola de vôlei no padrão Mikasa: três painéis que convergem fora do centro
 * (é isso que dá o volume de esfera) em branco, azul de quadra e amarelo.
 * A geometria foi gerada por espirais — não mexa nos paths na mão.
 */
export function VolleyballMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden
      className={cn('h-8 w-8', className)}
    >
      <defs>
        <radialGradient id="ba-sphere" cx="36%" cy="30%" r="78%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".35" />
        </radialGradient>
        <clipPath id="ba-clip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="46" fill="#FFFFFF" />
      <g clipPath="url(#ba-clip)">
      <path d="M 58.0 40.0 L 61.5 41.1 L 64.0 42.1 L 66.3 43.2 L 68.4 44.5 L 70.3 45.9 L 72.1 47.5 L 73.8 49.1 L 75.4 50.9 L 76.9 52.8 L 78.2 54.8 L 79.5 56.9 L 80.6 59.1 L 81.6 61.4 L 82.5 63.8 L 83.3 66.2 L 83.9 68.8 L 84.5 71.4 L 84.9 74.0 L 85.1 76.8 L 85.2 79.6 A 46 46 0 0 1 6.8 65.7 L 9.4 66.1 L 12.0 66.4 L 14.7 66.5 L 17.3 66.4 L 20.0 66.2 L 22.7 65.8 L 25.3 65.3 L 28.0 64.6 L 30.6 63.8 L 33.2 62.7 L 35.7 61.5 L 38.3 60.2 L 40.7 58.6 L 43.2 56.9 L 45.6 54.9 L 48.0 52.8 L 50.3 50.4 L 52.7 47.6 L 55.1 44.5 L 58.0 40.0 Z" fill="#FFFFFF" />
      <path d="M 58.0 40.0 L 55.1 44.5 L 52.7 47.6 L 50.3 50.4 L 48.0 52.8 L 45.6 54.9 L 43.2 56.9 L 40.7 58.6 L 38.3 60.2 L 35.7 61.5 L 33.2 62.7 L 30.6 63.8 L 28.0 64.6 L 25.3 65.3 L 22.7 65.8 L 20.0 66.2 L 17.3 66.4 L 14.7 66.5 L 12.0 66.4 L 9.4 66.1 L 6.8 65.7 A 46 46 0 0 1 58.0 4.7 L 56.5 5.9 L 55.1 7.1 L 53.8 8.5 L 52.7 9.9 L 51.6 11.4 L 50.8 13.0 L 50.1 14.6 L 49.5 16.2 L 49.1 18.0 L 48.8 19.7 L 48.7 21.5 L 48.8 23.4 L 49.1 25.2 L 49.5 27.1 L 50.2 29.0 L 51.0 31.0 L 52.1 33.0 L 53.5 35.0 L 55.3 37.2 L 58.0 40.0 Z" fill="#1D4ED8" />
      <path d="M 58.0 40.0 L 55.3 37.2 L 53.5 35.0 L 52.1 33.0 L 51.0 31.0 L 50.2 29.0 L 49.5 27.1 L 49.1 25.2 L 48.8 23.4 L 48.7 21.5 L 48.8 19.7 L 49.1 18.0 L 49.5 16.2 L 50.1 14.6 L 50.8 13.0 L 51.6 11.4 L 52.7 9.9 L 53.8 8.5 L 55.1 7.1 L 56.5 5.9 L 58.0 4.7 A 46 46 0 0 1 85.2 79.6 L 85.1 76.8 L 84.9 74.0 L 84.5 71.4 L 83.9 68.8 L 83.3 66.2 L 82.5 63.8 L 81.6 61.4 L 80.6 59.1 L 79.5 56.9 L 78.2 54.8 L 76.9 52.8 L 75.4 50.9 L 73.8 49.1 L 72.1 47.5 L 70.3 45.9 L 68.4 44.5 L 66.3 43.2 L 64.0 42.1 L 61.5 41.1 L 58.0 40.0 Z" fill="#FBBF24" />
      <path d="M 58.0 40.0 L 61.5 41.1 L 64.0 42.1 L 66.3 43.2 L 68.4 44.5 L 70.3 45.9 L 72.1 47.5 L 73.8 49.1 L 75.4 50.9 L 76.9 52.8 L 78.2 54.8 L 79.5 56.9 L 80.6 59.1 L 81.6 61.4 L 82.5 63.8 L 83.3 66.2 L 83.9 68.8 L 84.5 71.4 L 84.9 74.0 L 85.1 76.8 L 85.2 79.6" fill="none" stroke="#0B1120" strokeOpacity=".32" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 58.0 40.0 L 59.2 44.6 L 59.9 48.1 L 60.3 51.4 L 60.5 54.5 L 60.6 57.6 L 60.4 60.5 L 60.0 63.4 L 59.5 66.2 L 58.8 69.0 L 58.0 71.8 L 57.0 74.4 L 55.9 77.0 L 54.6 79.6 L 53.2 82.1 L 51.6 84.5 L 50.0 86.8 L 48.2 89.1 L 46.2 91.2 L 44.2 93.3 L 42.0 95.3" fill="none" stroke="#0B1120" strokeOpacity=".13" strokeWidth="1" strokeLinecap="round" />
      <path d="M 58.0 40.0 L 55.1 44.5 L 52.7 47.6 L 50.3 50.4 L 48.0 52.8 L 45.6 54.9 L 43.2 56.9 L 40.7 58.6 L 38.3 60.2 L 35.7 61.5 L 33.2 62.7 L 30.6 63.8 L 28.0 64.6 L 25.3 65.3 L 22.7 65.8 L 20.0 66.2 L 17.3 66.4 L 14.7 66.5 L 12.0 66.4 L 9.4 66.1 L 6.8 65.7" fill="none" stroke="#0B1120" strokeOpacity=".32" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 58.0 40.0 L 53.1 40.8 L 49.5 41.1 L 46.2 41.1 L 43.2 41.0 L 40.4 40.7 L 37.8 40.2 L 35.3 39.5 L 32.9 38.7 L 30.7 37.8 L 28.6 36.7 L 26.6 35.5 L 24.8 34.2 L 23.0 32.8 L 21.5 31.3 L 20.0 29.7 L 18.7 28.0 L 17.5 26.2 L 16.4 24.3 L 15.5 22.4 L 14.8 20.4" fill="none" stroke="#0B1120" strokeOpacity=".13" strokeWidth="1" strokeLinecap="round" />
      <path d="M 58.0 40.0 L 55.3 37.2 L 53.5 35.0 L 52.1 33.0 L 51.0 31.0 L 50.2 29.0 L 49.5 27.1 L 49.1 25.2 L 48.8 23.4 L 48.7 21.5 L 48.8 19.7 L 49.1 18.0 L 49.5 16.2 L 50.1 14.6 L 50.8 13.0 L 51.6 11.4 L 52.7 9.9 L 53.8 8.5 L 55.1 7.1 L 56.5 5.9 L 58.0 4.7" fill="none" stroke="#0B1120" strokeOpacity=".32" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 58.0 40.0 L 59.5 37.4 L 60.8 35.5 L 62.2 34.0 L 63.6 32.8 L 65.1 31.7 L 66.7 30.8 L 68.3 30.0 L 70.1 29.5 L 71.8 29.0 L 73.6 28.8 L 75.5 28.6 L 77.4 28.7 L 79.4 28.9 L 81.3 29.2 L 83.3 29.7 L 85.3 30.3 L 87.3 31.1 L 89.3 32.0 L 91.3 33.1 L 93.2 34.3" fill="none" stroke="#0B1120" strokeOpacity=".13" strokeWidth="1" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="46" fill="url(#ba-sphere)" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#0B1120" strokeOpacity=".45" strokeWidth="2" />
    </svg>
  );
}

/** Mesma bola em traço, para ícone pequeno — herda a cor do texto. */
export function VolleyballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn('h-6 w-6', className)}
    >
      <circle cx="50" cy="50" r="43" />
      <path d="M 58.0 40.0 L 61.5 41.1 L 64.0 42.1 L 66.3 43.2 L 68.4 44.5 L 70.3 45.9 L 72.1 47.5 L 73.8 49.1 L 75.4 50.9 L 76.9 52.8 L 78.2 54.8 L 79.5 56.9 L 80.6 59.1 L 81.6 61.4 L 82.5 63.8 L 83.3 66.2 L 83.9 68.8 L 84.5 71.4 L 84.9 74.0 L 85.1 76.8 L 85.2 79.6" />
      <path d="M 58.0 40.0 L 55.1 44.5 L 52.7 47.6 L 50.3 50.4 L 48.0 52.8 L 45.6 54.9 L 43.2 56.9 L 40.7 58.6 L 38.3 60.2 L 35.7 61.5 L 33.2 62.7 L 30.6 63.8 L 28.0 64.6 L 25.3 65.3 L 22.7 65.8 L 20.0 66.2 L 17.3 66.4 L 14.7 66.5 L 12.0 66.4 L 9.4 66.1 L 6.8 65.7" />
      <path d="M 58.0 40.0 L 55.3 37.2 L 53.5 35.0 L 52.1 33.0 L 51.0 31.0 L 50.2 29.0 L 49.5 27.1 L 49.1 25.2 L 48.8 23.4 L 48.7 21.5 L 48.8 19.7 L 49.1 18.0 L 49.5 16.2 L 50.1 14.6 L 50.8 13.0 L 51.6 11.4 L 52.7 9.9 L 53.8 8.5 L 55.1 7.1 L 56.5 5.9 L 58.0 4.7" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <VolleyballMark className="h-9 w-9" />
      <span className="heading text-lg leading-none">
        Bola<span className="text-brand">Alta</span>
      </span>
    </span>
  );
}
