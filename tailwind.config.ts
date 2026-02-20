// tailwind.config.ts
import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mywallet: {
          "primary": "#7c3aed",
          "secondary": "#2dd4bf",
          "accent": "#f471b5",
          "neutral": "#1e1e2e",
          "base-100": "#0f172a",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
          
          "--rounded-box": "1rem", 
          "--rounded-btn": "0.8rem", 
        },
      },
      "dark",
    ],
    darkTheme: "mywallet",
  },
};

export default config;