/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  // v1 is light-only (app.json userInterfaceStyle: light). 'class' stops NativeWind on web
  // from throwing "Cannot manually set color scheme" when the <html> class changes.
  darkMode: "class",
  theme: {
    extend: {
      // "Soft Desk" type system (fonts loaded in src/app/_layout.tsx).
      // Custom fonts carry their own weight, so use these instead of font-bold etc.
      fontFamily: {
        display: ['BricolageGrotesque_800ExtraBold'],
        'display-bold': ['BricolageGrotesque_700Bold'],
        serif: ['Newsreader_600SemiBold'],
        'serif-medium': ['Newsreader_500Medium'],
        sans: ['Figtree_500Medium'],
        'sans-regular': ['Figtree_400Regular'],
        'sans-semibold': ['Figtree_600SemiBold'],
        'sans-bold': ['Figtree_700Bold'],
      },
      colors: {
        // "Soft Desk" palette — see the Foundations board in the design canvas.
        paper: "#F3F1EC",
        ink: "#1C1C1E",
        muted: "#6E6A63",
        hairline: "#EDE9E1",
        pastel: {
          pink: "#F6C6DD",
          "pink-soft": "#FBE3EE",
          sky: "#C9DCF4",
          "sky-soft": "#E3EDFA",
          peach: "#F9D7BF",
          "peach-soft": "#FCEADD",
          mint: "#CDEBD7",
          "mint-soft": "#E4F4E9",
          lilac: "#D9C8F2",
          "lilac-soft": "#ECE3FA",
          butter: "#F7E7B0",
          "butter-soft": "#FBF2D5",
        },
        go: "#3DBE6B",
        // Warm neutrals replace Tailwind's cool slate everywhere in the app.
        slate: {
          50: "#F3F1EC",
          100: "#EDE9E1",
          200: "#E6E2DA",
          300: "#D8D3CA",
          400: "#A39D93",
          500: "#6E6A63",
          600: "#4A463F",
          700: "#3B372F",
          800: "#2A2724",
          900: "#1C1C1E",
          950: "#121212",
        },
        // Light shades become the sky pastel; strong shades become ink, so
        // existing "primary blue" buttons and links render as black pills.
        blue: {
          50: "#EEF4FC",
          100: "#E3EDFA",
          200: "#C9DCF4",
          300: "#A9C6EC",
          400: "#6F9AD6",
          500: "#3D6FBF",
          600: "#1C1C1E",
          700: "#121212",
          800: "#22385A",
          900: "#1C2B44",
          950: "#111A2B",
        },
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
        primary: "#1C1C1E", // Ink — primary actions are black pills
        "on-primary": "#FFFFFF",
        "primary-container": "#EFF6FF", // Blue 50
        "on-primary-container": "#1E40AF", // Blue 800

        secondary: "#0F172A", // Slate 900
        "on-secondary": "#FFFFFF",
        "secondary-container": "#F1F5F9", // Slate 100
        "on-secondary-container": "#0F172A",

        surface: "#F3F1EC", // Paper
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F3F1EC",
        "surface-container": "#FFFFFF", // Pure crisp white card surface
        "surface-container-high": "#F1F5F9",
        "surface-container-highest": "#E2E8F0",

        background: "#F3F1EC",
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
        DEFAULT: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.375rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
