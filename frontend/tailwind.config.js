/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 22px 60px rgba(15, 23, 42, 0.35)"
      },
      colors: {
        ink: "#0F172A",
        mist: "#E2E8F0",
        accent: "#14B8A6",
        sunrise: "#FB7185"
      }
    }
  },
  plugins: []
};
