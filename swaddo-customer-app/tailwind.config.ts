import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E2401C",
        "primary-hover": "#B82F12",
        accent: "#E8A33D",
        "bg-main": "#FFF8F0",
        "bg-alt": "#FFFFFF",
        "text-primary": "#2B2420",
        "text-muted": "#6B6259",
        "border-subtle": "rgba(43, 36, 32, 0.12)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
