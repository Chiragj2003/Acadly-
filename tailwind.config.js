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
        // Core Stitch Design System Palette
        primary: "#000000",
        "on-primary": "#ffffff",
        "primary-container": "#131b2e",
        "on-primary-container": "#7c839b",
        "primary-fixed": "#dae2fd",
        "primary-fixed-dim": "#bec6e0",
        "on-primary-fixed": "#131b2e",
        "on-primary-fixed-variant": "#3f465c",

        secondary: "#0051d5",
        "on-secondary": "#ffffff",
        "secondary-container": "#316bf3",
        "on-secondary-container": "#fefcff",
        "secondary-fixed": "#dbe1ff",
        "secondary-fixed-dim": "#b4c5ff",
        "on-secondary-fixed": "#00174b",
        "on-secondary-fixed-variant": "#003ea8",

        tertiary: "#000000",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#002114",
        "on-tertiary-container": "#069669",
        "tertiary-fixed": "#85f8c4",
        "tertiary-fixed-dim": "#68dba9",
        "on-tertiary-fixed": "#002114",
        "on-tertiary-fixed-variant": "#005137",

        surface: "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-tint": "#565e74",
        "surface-variant": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",

        "on-surface": "#0b1c30",
        "on-surface-variant": "#45464d",
        background: "#f8f9ff",
        "on-background": "#0b1c30",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        outline: "#76777d",
        "outline-variant": "#c6c6cd",

        // Role-based Accents
        role: {
          admin: "#131b2e",
          teacher: "#0051d5",
          student: "#069669",
          parent: "#d97706",
        }
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
