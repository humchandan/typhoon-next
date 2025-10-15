/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#edf6fd",
          100: "#dbeffd",
          500: "#2256f2"
        },
      },
    },
  },
  plugins: [],
}
