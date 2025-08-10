// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class', // Ajout de cette ligne pour activer le mode sombre via la classe
  theme: {
    extend: {
      colors: {
        appleBlue: "#0071e3",
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out both",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
