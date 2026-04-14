import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // ── Design-system surface tokens ──
        surface: {
          DEFAULT: "#121317",
          dim: "#121317",
          bright: "#38393d",
          lowest: "#0d0e12",
          low: "#1a1b1f",
          container: "#1e1f23",
          high: "#292a2e",
          highest: "#343539",
          variant: "#343539",
        },
        // ── On-surface (text on dark bg) ──
        "on-surface": {
          DEFAULT: "#e3e2e7",
          variant: "#c1c6d7",
        },
        // ── Primary ──
        primary: {
          DEFAULT: "#adc6ff",
          container: "#4b8eff",
          action: "#007AFF",
          dark: "#005ecb",
        },
        "on-primary": {
          DEFAULT: "#002e69",
          container: "#00285c",
        },
        // ── Secondary ──
        secondary: {
          DEFAULT: "#c2c1ff",
          container: "#3834b6",
        },
        // ── Tertiary ──
        tertiary: {
          DEFAULT: "#ffb595",
          container: "#ef6719",
        },
        // ── Error ──
        "ds-error": {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        // ── Outline ──
        outline: {
          DEFAULT: "#8b90a0",
          variant: "#414755",
        },
        // ── Elevation surfaces ──
        "el-0": "#0B0B0B",
        "el-1": "#1C1C1E",
        "el-2": "#2C2C2E",
      },
      borderRadius: {
        pill: "9999px",
        "bubble": "1.125rem", // 18px
        "bubble-lg": "1.5rem",  // 24px
      },
      animation: {
        border: "border 4s linear infinite",
      },
      keyframes: {
        border: {
          to: { "--border-angle": "360deg" },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        loqui: {
          "primary": "#007AFF",
          "secondary": "#3834b6",
          "accent": "#ef6719",
          "neutral": "#1e1f23",
          "base-100": "#121317",
          "base-200": "#1a1b1f",
          "base-300": "#292a2e",
          "info": "#adc6ff",
          "success": "#34d399",
          "warning": "#fbbf24",
          "error": "#ffb4ab",
        },
      },
    ],
  },
};
