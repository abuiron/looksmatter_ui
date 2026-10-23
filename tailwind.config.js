import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand gold sampled from the LOOKSMATTER shield (#CD943B = 500).
        // 500 is for accents and dark backgrounds; use 700+ for text on light backgrounds.
        gold: {
          50: '#FBF6EC',
          100: '#F6EAD2',
          200: '#EDD3A4',
          300: '#E2B871',
          400: '#D8A350',
          500: '#CD943B',
          600: '#B37A2C',
          700: '#8F5F25',
          800: '#744C23',
          900: '#5F3F20',
          950: '#36210F',
        },
        // Warm ivory used for page tints and image placeholders.
        cream: {
          50: '#FCFBF8',
          100: '#F8F6F1',
          200: '#F1EDE4',
          300: '#E6DFD1',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        display: ['Outfit', ...defaultTheme.fontFamily.sans],
        serif: ['"Instrument Serif"', ...defaultTheme.fontFamily.serif],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12, 10, 9, 0.04), 0 4px 16px -4px rgba(12, 10, 9, 0.08)',
        lift: '0 2px 6px rgba(12, 10, 9, 0.05), 0 18px 40px -14px rgba(12, 10, 9, 0.22)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        'draw-check': {
          from: { strokeDashoffset: '48' },
          to: { strokeDashoffset: '0' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down': 'slide-down 0.25s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 40s linear infinite',
        shake: 'shake 0.4s ease-in-out',
        'draw-check': 'draw-check 0.5s 0.35s ease-out both',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
