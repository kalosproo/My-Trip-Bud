import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        ink: "#18181B",
        slate: "#3F3F46",
        bone: "#FAFAFA",
        accent: "#2563EB",
      },
      boxShadow: {
        soft: "0 1px 1px rgba(255,255,255,0.6), 0 20px 40px -20px rgba(24,24,27,0.12)",
        "inset-soft": "inset 0 1px 1px rgba(255,255,255,0.7)",
      },
      transitionTimingFunction: {
        fluid: "cubic-bezier(0.32,0.72,0,1)",
      },
    },
  },
  plugins: [],
};
export default config;
