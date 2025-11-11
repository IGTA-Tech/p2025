/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        biblical: {
          deepblue: '#2c3e50',
          gold: '#d4af37',
          sand: '#e8dcc4',
          parchment: '#f4ecd8',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      }
    }
  },
  plugins: [],
}
