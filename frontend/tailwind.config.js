/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#FFFFFF",
        surface: "#F1F5F9",
        cream: "#F8FAFC",
        line: "#E2E8F0",
        gray: "#64748B",

        accent: "#2563EB",
        accentdark: "#1D4ED8",

        sale: "#DC2626",
        star: "#C5A46D",

        primary: "#2563EB",
        "primary-dark": "#1D4ED8",
        "accent-dim": "#EFF6FF",
      },

      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },

      letterSpacing: {
        widest2: "0.14em",
        tightest: "-0.035em",
      },

      borderRadius: {
        DEFAULT: "10px",
      },

      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
    },
  },

  plugins: [],
};