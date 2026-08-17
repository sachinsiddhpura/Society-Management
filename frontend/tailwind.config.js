/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80abff',
          400: '#4d82ff',
          500: '#265fff',
          600: '#1745db',
          700: '#1234ab',
          800: '#122c85',
          900: '#132a69',
        },
      },
    },
  },
  plugins: [],
}
