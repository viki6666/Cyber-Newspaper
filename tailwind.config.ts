import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-pink': '#FF006E',
        'cyber-green': '#06FFA5',
        'cyber-yellow': '#FFBE0B',
        'cyber-purple': '#8338EC',
        'cyber-blue': '#3A86FF',
      },
      fontFamily: {
        'headline': ['Impact', 'Arial Black', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
