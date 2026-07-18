import type { Config } from "tailwindcss";

/**
 * Project Gooseneck — Tailwind config.
 *
 * NOTE: With Tailwind v4 (recommended), theme tokens live in `app/globals.css`
 * (@theme inline) and THAT file is the single source of truth. This config is
 * kept for: (a) Tailwind v3 setups, and (b) explicit content globs / plugins.
 * Every value below points back to the CSS variables declared in globals.css,
 * so the two never drift.
 */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        background: "var(--bg)",
        foreground: "var(--text)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: {
          DEFAULT: "var(--text)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        "fg-inverse": "var(--fg-inverse)",
        brand: {
          DEFAULT: "var(--brand)",
          contrast: "var(--brand-contrast)",
        },
        danger: "var(--danger)",
        success: "var(--success)",
        // shadcn/ui aliases
        card: "var(--surface)",
        popover: "var(--surface)",
        primary: "var(--text)",
        secondary: "var(--surface-2)",
        muted: "var(--surface-2)",
        accent: "var(--surface-2)", // neutral hover — NOT the brand color
        destructive: "var(--danger)",
        input: "var(--border-strong)",
        ring: "var(--text)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
      },
    },
  },
  plugins: [],
} satisfies Config;
