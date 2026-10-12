import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        background: v("background"),
        foreground: v("foreground"),
        card: v("card"),
        muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
        border: v("border"),
        ring: v("primary"),
        primary: { DEFAULT: v("primary"), foreground: "#FFFFFF" },
        gold: { DEFAULT: v("gold"), foreground: "#FFFFFF" },
        forest: v("forest"),
        grass: v("grass"),
        mist: v("mist"),
        // Fixed brand swatches from the UI kit.
        navy: "#1D314F",
        terracotta: "#C15C46",
        honey: "#E2A34A",
        cream: "#F7F4EB",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "Cambria", "serif"],
        sans: ["Nunito", "ui-rounded", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        paper: "0 1px 0 rgb(255 255 255 / .6) inset, 0 10px 30px -12px rgb(29 49 79 / .18)",
        device: "0 0 0 10px rgb(var(--card)), 0 0 0 11px rgb(var(--border)), 0 30px 60px -20px rgb(29 49 79 / .35)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-8px) rotate(3deg)" } },
        pulseRing: { "0%": { transform: "scale(1)", opacity: ".6" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "pulse-ring": "pulseRing 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
