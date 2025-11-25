/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7fc',
          100: '#b3e8f5',
          200: '#80d9ee',
          300: '#4dcae7',
          400: '#1abbe0',
          500: '#00A5CF', // Turquoise Surf - Main brand color
          600: '#0084a6',
          700: '#00637d',
          800: '#004254',
          900: '#00212b',
        },
      },
    },
  },
  plugins: [],
}

