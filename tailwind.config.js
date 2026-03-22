/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        xtypewriter: ['xtypewriter', 'monospace'],
        rursus: ['rursus', 'monospace'],
      },
    },
  },
  plugins: [],
}

