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
          magenta: '#FF00FF',
          morado: '#9900CC',
          celeste: '#199DD0',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        bombing: ['var(--font-bombing)', 'sans-serif'],
        sans: ['var(--font-montserrat)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
