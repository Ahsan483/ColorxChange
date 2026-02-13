/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode via class strategy
  theme: {
    extend: {
      colors: {
        'bg-app': 'var(--bg-app)',
        'bg-panel': 'var(--bg-panel)',
        'text-primary': 'var(--text-primary)',
        'primary': 'var(--primary)',
      }
      // We can extend more from our CSS variables here
    },
  },
  plugins: [],
}
