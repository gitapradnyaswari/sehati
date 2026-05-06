/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      colors: {
        brand: {
          blue:      '#1a6fa8',
          teal:      '#2aab7e',
          dark:      '#0e2233',
          deeper:    '#081420',
          tealHover: '#229068',
        },
        text: {
          main:  '#0e2233',
          muted: '#4f6370',
          faint: '#8fa3b0',
        },
        bg: {
          page: '#f7fafa',
          card: '#ffffff',
        },
        border: {
          DEFAULT: '#dde8ec',
          soft:    '#eaf1f4',
        },
      },
      fontSize: {
        'eyebrow': ['11px', { letterSpacing: '0.14em', fontWeight: '500' }],
      },
    },
  },
}

module.exports = config