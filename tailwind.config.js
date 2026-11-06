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

        // Acadly iOS & Modern Mobile Academic Palette (HIG & WCAG AAA Compliant)
        primary: "#2563EB", // iOS System Blue / Acadly Royal Blue
        "on-primary": "#FFFFFF",
        "primary-container": "#EFF6FF", // Blue 50
        "on-primary-container": "#1E40AF", // Blue 800

        secondary: "#0F172A", // Slate 900
        "on-secondary": "#FFFFFF",
        "secondary-container": "#F1F5F9", // Slate 100
        "on-secondary-container": "#0F172A",

        surface: "#F8FAFC", // Slate 50 (Clean iOS System Background)
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F8FAFC",
        "surface-container": "#FFFFFF", // Pure crisp white card surface
        "surface-container-high": "#F1F5F9",
        "surface-container-highest": "#E2E8F0",

        background: "#F8FAFC",
        "on-background": "#0F172A",
        "on-surface": "#0F172A", // High contrast readable dark slate
        "on-surface-variant": "#475569", // Slate 600 (Exceeds 7:1 contrast ratio)

        outline: "#CBD5E1", // Slate 300
        "outline-variant": "#E2E8F0", // Slate 200 hairline border

        // Semantic Feedback Tokens (Guaranteed resolutions)
        error: "#E11D48", // Rose 600
        "error-container": "#FFE4E6", // Rose 100
        "on-error": "#FFFFFF",
        "on-error-container": "#9F1239", // Rose 800

        success: "#059669", // Emerald 600
        "success-container": "#ECFDF5", // Emerald 50
        "on-success": "#FFFFFF",
        "on-success-container": "#065F46", // Emerald 800

        warning: "#D97706", // Amber 600
        "warning-container": "#FEF3C7", // Amber 100
        "on-warning": "#FFFFFF",
        "on-warning-container": "#92400E", // Amber 800

        info: "#2563EB", // Blue 600
        "info-container": "#EFF6FF", // Blue 50
        "on-info": "#FFFFFF",
        "on-info-container": "#1E40AF", // Blue 800

        // Role-based Accents
        role: {
          admin: "#0F172A",
          teacher: "#2563EB",
          student: "#059669",
          parent: "#D97706",
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
