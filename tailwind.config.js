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
        // Cute, Warm, Mind&Me & Moodpress Pastel Palette
        cute: {
          cream: "#fbf9f5",
          card: "#ffffff",
          border: "#f1ebe4",
          peach: "#ff7d6b",
          "peach-light": "#fff0ec",
          blush: "#ffb4c2",
          "blush-light": "#fff1f4",
          coral: "#ff6f59",
          lavender: "#9e86f8",
          "lavender-light": "#f3efff",
          mint: "#52b788",
          "mint-light": "#e8f8f0",
          butter: "#ffc93c",
          "butter-light": "#fff9e6",
          cocoa: "#2e2421",
          muted: "#7d6f6a",
          soft: "#a89993",
        },

        // Core Palette
        primary: "#ff7d6b",
        "on-primary": "#ffffff",
        "primary-container": "#fff0ec",
        "on-primary-container": "#9e2a1b",

        secondary: "#52b788",
        "on-secondary": "#ffffff",
        "secondary-container": "#e8f8f0",
        "on-secondary-container": "#185e3a",

        surface: "#fbf9f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f2ec",
        "surface-container": "#f1ebe4",

        background: "#fbf9f5",
        "on-background": "#2e2421",
        "on-surface": "#2e2421",
        "on-surface-variant": "#7d6f6a",

        outline: "#e5ded7",
        "outline-variant": "#f1ebe4",

        // Role-based Accents (Warm & Cheerful)
        role: {
          admin: "#403d39",
          teacher: "#ff7d6b",
          student: "#52b788",
          parent: "#ffc93c",
        }
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
