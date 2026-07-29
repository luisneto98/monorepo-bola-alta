import type { Config } from 'tailwindcss';

/** Tokens do design system — ver design-system/bola-alta-comunidade/MASTER.md */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0B1120',
        surface: {
          DEFAULT: '#141C2F',
          high: '#1C2740',
        },
        line: {
          DEFAULT: '#2C3A57',
          soft: '#1F2A44',
        },
        fg: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          dim: '#64748B',
        },
        // Laranja da bola.
        brand: {
          DEFAULT: '#F97316',
          strong: '#EA580C',
          soft: '#7C2D12',
        },
        // Azul da quadra.
        court: {
          DEFAULT: '#3B82F6',
          strong: '#1D4ED8',
          soft: '#1E3A8A',
        },
        go: { DEFAULT: '#10B981', soft: '#064E3B' },
        warn: { DEFAULT: '#FBBF24', soft: '#78350F' },
        stop: { DEFAULT: '#F43F5E', soft: '#881337' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
        pill: '999px',
      },
      fontSize: {
        display: ['clamp(2rem, 9vw, 3.5rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        score: ['clamp(2.5rem, 12vw, 4.5rem)', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
      },
      animation: {
        marquee: 'marquee 22s linear infinite',
        'rise-in': 'rise-in .3s cubic-bezier(.2,.8,.2,1) both',
        'slide-up': 'slide-up .25s cubic-bezier(.2,.8,.2,1) both',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
