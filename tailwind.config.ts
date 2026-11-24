import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tango: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d2d9',
          300: '#f4adb9',
          400: '#eb7a8f',
          500: '#de4967',
          600: '#c82949',
          700: '#a81c39',
          800: '#8c1a32',
          900: '#771b2f',
          950: '#430a15',
        },
        wine: {
          DEFAULT: '#881337',
          deep: '#4c0519',
          light: '#9f1239',
        },
        gold: {
          light: '#fef08a',
          DEFAULT: '#d97706',
          dark: '#b45309',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
