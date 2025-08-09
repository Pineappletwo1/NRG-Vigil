/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/svelte/**/*.svelte",
    "./app/svelte/**/*.js",
    "./app/templates/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#393e46",
        secondary: "#2c3036",
        accent: "#78808e",
        dark: "#222831",
        text: "#dfd0b8",
        background: "#222831",
      },
    },
  },
  plugins: [],
};
