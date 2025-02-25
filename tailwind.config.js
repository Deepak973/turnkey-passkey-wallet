/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "funnel-sans": ["var(--font-funnel-sans)"],
      },
      colors: {
        primary: "#007AFF", // or your preferred primary color
      },
    },
  },
  plugins: [],
};
