/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tt: ['cmuntt', 'monospace'],
        it: ['cmunit', 'monospace'],
        tb: ['cmuntb', 'monospace'],
        tx: ['cmuntx', 'monospace'],
      },
    },
  },
  plugins: [],
}

