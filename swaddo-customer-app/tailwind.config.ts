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
        "bg-main": "#F8F9FA", // Swiggy/Zomato style light gray bg
        "bg-alt": "#FFFFFF",
        "text-primary": "#1C1C1E", // Native iOS dark text
        "text-muted": "#6C6C70", // Native iOS gray text
        "border-subtle": "rgba(0, 0, 0, 0.05)",
      },
      boxShadow: {
        'native': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'native-lg': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'float': '0 -4px 24px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
