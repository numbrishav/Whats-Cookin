/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display',
          'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        accent: {
          DEFAULT: '#E8622A',
          light:   '#FF8040',
          subtle:  '#FFF3ED',
          dark:    '#C44E1C',
        },
        surface: {
          DEFAULT:  '#FFFCF8',
          card:     '#FFFFFF',
          elevated: '#FFFFFF',
          muted:    '#F5EEE6',
        },
        warm: {
          900: '#1C1410',
          700: '#4A3728',
          600: '#5C4238',
          500: '#6B5E57',
          400: '#8B7B75',
          300: '#AFA49E',
          200: '#D4C9C3',
          100: '#EDE6DF',
          50:  '#F5EEE6',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card:     '0 1px 4px rgba(28,20,16,0.07), 0 1px 2px rgba(28,20,16,0.04)',
        sheet:    '0 -4px 32px rgba(28,20,16,0.10)',
        elevated: '0 4px 20px rgba(28,20,16,0.10)',
        glow:     '0 0 0 3px rgba(232,98,42,0.18)',
      },
      animation: {
        'slide-up':  'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)',
        'fade-in':   'fadeIn 0.2s ease-out',
        'scale-in':  'scaleIn 0.22s cubic-bezier(0.32,0.72,0,1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(100%)' },                to: { transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' },                                  to: { opacity: '1' } },
        scaleIn:   { from: { transform: 'scale(0.95)', opacity: '0' },        to: { transform: 'scale(1)', opacity: '1' } },
        bounceIn:  { from: { transform: 'scale(0.85)', opacity: '0' },        to: { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
