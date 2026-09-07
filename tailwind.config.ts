import type { Config } from "tailwindcss";

/**
 * Design tokens from 02-DESIGN.md §2
 * Type scale: 1.25 modular ratio from 16px body base
 * Palette v2: warm "amber phosphor" terminal — see app/globals.css
 */
const config: Config = {
  theme: {
    colors: {
      bg: "#0E0D0B",
      "bg-raised": "#16140F",
      "text-primary": "#D8D2C4",
      "text-muted": "#8F887A",
      "accent-add": "#D29922",
      "accent-remove": "#F47067",
      "accent-link": "#D8B478",
      border: "#2A261E",
      transparent: "transparent",
      current: "currentColor",
    },
    fontFamily: {
      sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      display: ["var(--font-fragment-mono)", "monospace"],
      mono: ["var(--font-jetbrains-mono)", "monospace"],
    },
    fontSize: {
      xs: ["0.64rem", { lineHeight: "1.5" }],
      sm: ["0.8rem", { lineHeight: "1.5" }],
      base: ["1rem", { lineHeight: "1.6" }],
      lg: ["1.25rem", { lineHeight: "1.5" }],
      xl: ["1.563rem", { lineHeight: "1.4" }],
      "2xl": ["1.953rem", { lineHeight: "1.35" }],
      "3xl": ["2.441rem", { lineHeight: "1.25" }],
      "4xl": ["3.052rem", { lineHeight: "1.15" }],
      "5xl": ["3.815rem", { lineHeight: "1.1" }],
      "6xl": ["4.768rem", { lineHeight: "1.05" }],
      "7xl": ["5.96rem", { lineHeight: "1" }],
    },
  },
};

export default config;
