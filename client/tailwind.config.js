/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#060911",
          900: "#0B1220",
          800: "#121B2D",
          700: "#1C2740",
          600: "#2A3854",
        },
        gold: {
          200: "#F3E6B3",
          300: "#EAD79A",
          400: "#DFC163",
          500: "#C9A227",
          600: "#A8871E",
          700: "#8A6E17",
        },
        paper: {
          50: "#FBFAF7",
          100: "#F5F2EA",
          200: "#EAE5D8",
          300: "#DCD5C3",
        },
        dark: {
          bg: "#0B1220",
          card: "#121B2D",
          border: "#1C2740",
          text: "#F5F2EA",
          textSecondary: "#A0A8B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(11, 18, 32, 0.18)",
        lift: "0 24px 60px -20px rgba(11, 18, 32, 0.28)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
