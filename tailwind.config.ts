import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        forest: {
          50: "#EEF6F5",
          100: "#D5E9E6",
          200: "#A9D2CD",
          300: "#73B3AC",
          400: "#3F8D86",
          500: "#1F6F69",
          600: "#175D58",
          700: "#134E4A", // brand forest green
          800: "#0E3B38",
          900: "#0A2B29",
          950: "#061C1B",
        },
        amber: {
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // brand gold
          600: "#D97706",
          700: "#B45309",
        },
        sand: {
          50: "#FBF8F1",
          100: "#F5EFE2",
          200: "#EADFC8",
          300: "#DCCAA6",
          400: "#C7AE80",
        },
        clay: { 500: "#B4532A", 600: "#96411F" },
        ink: "#0C211F",
      },
      fontFamily: {
        display: ["'Fraunces Variable'", "Georgia", "serif"],
        sans: ["'Manrope Variable'", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.5rem" },
      boxShadow: {
        lift: "0 18px 40px -18px rgba(10, 43, 41, 0.45)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: { drift: "drift 7s ease-in-out infinite" },
    },
  },
  plugins: [],
};

export default config;
