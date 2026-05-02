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
          DEFAULT: '#128C7E',
          dark: '#075E54',
          light: '#25D366',
        },
        accent: '#34B7F1',
        background: '#ECE5DD',
        surface: '#FFFFFF',
        'text-primary': '#303030',
        'text-secondary': '#667781',
        error: '#E53935',
        success: '#43A047',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
