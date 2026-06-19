import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — a warm violet that reads well on dark backgrounds.
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          DEFAULT: '#0b0b12',
          raised: '#14141f',
          overlay: '#1c1c2b',
          border: '#2a2a3c',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.8)' },
          '15%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-120px) scale(1.2)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'float-up': 'float-up 2.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
