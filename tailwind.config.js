/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        brand: {
          blue: '#1E40AF',
          indigo: '#4F46E5',
          teal: '#0D9488',
          emerald: '#059669',
          amber: '#D97706',
          rose: '#E11D48',
          dark: '#0F172A',
          card: '#1E293B',
        }
      },
    },
  },
  plugins: [],
};
