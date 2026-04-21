import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-variant": "#d9dde0",
        "on-surface": "#2c2f31",
        "background": "#f5f7f9",
        "secondary-dim": "#2d46ab",
        "inverse-primary": "#4e8eff",
        "surface-container-lowest": "#ffffff",
        "error-dim": "#9f0519",
        "secondary": "#3b53b7",
        "primary": "#0057be",
        "surface": "#f5f7f9",
        "inverse-surface": "#0b0f10",
        "secondary-fixed-dim": "#b5c1ff",
        "surface-dim": "#d0d5d8",
        "on-primary-container": "#002150",
        "on-error": "#ffefee",
        "on-background": "#2c2f31",
        "tertiary": "#893b92",
        "on-tertiary-fixed-variant": "#6d2177",
        "tertiary-fixed": "#f79efd",
        "primary-dim": "#004ca7",
        "error-container": "#fb5151",
        "error": "#b31b25",
        "secondary-container": "#c7cfff",
        "on-secondary": "#f2f1ff",
        "outline-variant": "#abadaf",
        "on-secondary-fixed": "#03278f",
        "surface-container-low": "#eef1f3",
        "surface-container": "#e5e9eb",
        "on-tertiary-container": "#63156d",
        "surface-tint": "#0057be",
        "on-primary-fixed-variant": "#002a62",
        "surface-container-highest": "#d9dde0",
        "surface-bright": "#f5f7f9",
        "outline": "#747779",
        "on-tertiary": "#ffeefa",
        "on-primary-fixed": "#000000",
        "on-surface-variant": "#595c5e",
        "surface-container-high": "#dfe3e6",
        "on-tertiary-fixed": "#460050",
        "primary-fixed-dim": "#5491ff",
        "tertiary-dim": "#7b2f85",
        "primary-container": "#6f9fff",
        "secondary-fixed": "#c7cfff",
        "inverse-on-surface": "#9a9d9f",
        "tertiary-fixed-dim": "#e891ee",
        "on-error-container": "#570008",
        "primary-fixed": "#6f9fff",
        "tertiary-container": "#f79efd",
        "on-primary": "#f0f2ff",
        "on-secondary-container": "#233da2",
        "on-secondary-fixed-variant": "#2e47ac",
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["var(--font-inter)", "Inter", "sans-serif"],
        "body": ["var(--font-inter)", "Inter", "sans-serif"],
        "label": ["var(--font-inter)", "Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ],
};
export default config;
