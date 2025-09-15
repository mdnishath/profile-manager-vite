/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./electron/**/*.{js,ts}", // optional if you add styled components in preload
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
