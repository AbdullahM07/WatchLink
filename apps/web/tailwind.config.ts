import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        // Brand — an evolved orchid. Warmer and more luminous than the old
        // blue-violet so it reads like a cinema marquee, not a dev tool.
        brand: {
          50: '#fbf4ff',
          100: '#f6e6ff',
          200: '#edccff',
          300: '#dfa8fb',
          400: '#cd80f6',
          500: '#b85aec',
          600: '#a23bd8',
          700: '#862bb4',
          800: '#6c2491',
          900: '#561f73',
        },
        // Accent — warm "house lights" gold. Reserved for the social, cinematic
        // moments: voice-live, reactions, joins, highlights. Never decoration.
        accent: {
          50: '#fff8ec',
          100: '#ffedcc',
          200: '#ffdb99',
          300: '#ffc861',
          400: '#ffb43a',
          500: '#f59e0b',
          600: '#d97d06',
          700: '#b35e09',
          800: '#90490f',
          900: '#763d10',
        },
        // Surfaces — a warm plum-charcoal "theater dark" rather than cold black.
        surface: {
          DEFAULT: '#130f1a',
          raised: '#1c1626',
          overlay: '#271f33',
          border: '#372c47',
        },
        // Semantic status colors — named so call sites read as "danger"/"success"
        // rather than raw red/emerald. Same values as Tailwind's defaults.
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        // Soft marquee glow for live/social states.
        glow: '0 0 0 1px rgb(245 158 11 / 0.35), 0 0 24px -4px rgb(245 158 11 / 0.5)',
        'glow-brand': '0 0 0 1px rgb(184 90 236 / 0.35), 0 0 24px -4px rgb(184 90 236 / 0.5)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1100',
        overlay: '1200',
        modal: '1300',
        toast: '1400',
        tooltip: '1500',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.7)' },
          '12%': { opacity: '1', transform: 'translateY(0) scale(1.1)' },
          '30%': { transform: 'translateY(-30px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-150px) scale(1.25)' },
        },
        // Pulsing ring for the active speaker / live voice.
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        'float-up': 'float-up 2.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
