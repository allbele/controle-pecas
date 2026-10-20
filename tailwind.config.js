/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6f1', 100: '#d6eadd', 200: '#aed5bd', 300: '#7fba98',
          400: '#519b74', 500: '#357c59', 600: '#286347', 700: '#1f4d3a',
          800: '#183c2e', 900: '#122d23',
        },
        paper: '#f6f5f1',
        ink: '#1c1b18',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,10,.06), 0 4px 14px rgba(20,20,10,.05)',
      },
    },
  },
  plugins: [],
}
