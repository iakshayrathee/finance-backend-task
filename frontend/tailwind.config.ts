import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system: dark finance/trading aesthetic
        background:    '#0f1117',
        surface:       '#1a1d27',
        'surface-2':   '#21253a',
        border:        '#2a2d3e',
        primary:       '#6366f1',
        'primary-hover': '#5558e0',
        success:       '#22c55e',
        danger:        '#ef4444',
        warning:       '#f59e0b',
        // Text colors — referenced both as `text-muted` and `text-text-muted`
        muted:         '#94a3b8',
        'text-primary': '#e2e8f0',
        'text-muted':   '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-green':    'pulseGreen 1.5s ease-in-out',
        'pulse-red':      'pulseRed 1.5s ease-in-out',
        'count-up':       'countUp 0.8s ease-out',
        'spin-slow':      'spin 3s linear infinite',
      },
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%':      { backgroundColor: 'rgba(34,197,94,0.15)' },
        },
        pulseRed: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%':      { backgroundColor: 'rgba(239,68,68,0.15)' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
