/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060a',
          900: '#0a0c14',
          850: '#0e111b',
          800: '#131726',
          700: '#1b2032',
          600: '#262d44',
          500: '#3a4263',
          400: '#5b6485',
          300: '#8a92b0',
          200: '#b8bed6',
          100: '#dfe3f0',
        },
        electric: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3cdff',
          300: '#80a8ff',
          400: '#4d83ff',
          500: '#2b62ff',
          600: '#1a47e6',
          700: '#1338b8',
          800: '#102c8f',
          900: '#0d2270',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'dash': 'dash 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        dash: { to: { strokeDashoffset: '-20' } },
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(43,98,255,0.4), 0 8px 40px -8px rgba(43,98,255,0.35)',
        'glow-sm': '0 0 0 1px rgba(43,98,255,0.3), 0 4px 20px -6px rgba(43,98,255,0.25)',
        'card': '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid': "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        'radial-fade': 'radial-gradient(circle at 50% 0%, rgba(43,98,255,0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};
