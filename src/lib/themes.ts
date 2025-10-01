// Brand colors - Asana-inspired professional palette
export const brandColors = {
  primary: {
    50: "#f8f9ff", // Lightest blue-purple
    100: "#f0f2ff", 
    200: "#e1e6ff",
    300: "#d1d9ff",
    400: "#c2ccff",
    500: "#3F69B2", // Main blue-purple
    600: "#5356A5", // Darker purple
    700: "#4a4d94",
    800: "#414483",
    900: "#383b72",
  },
  secondary: {
    50: "#f0fdfa", // Lightest teal
    100: "#e6f7f5",
    200: "#b3e5e0",
    300: "#80d3cb",
    400: "#4dc1b6",
    500: "#6DCDD2", // Tiffany Blue - Primary action buttons, success states, important CTAs
    600: "#5bb8bd",
    700: "#4aa3a8",
    800: "#388e93",
    900: "#26797e",
  },
  accent: {
    50: "#f0f8ff", // Lightest blue
    100: "#e6f2ff",
    200: "#b3d9ff",
    300: "#80c0ff",
    400: "#4da7ff",
    500: "#CCE5FE", // Columbia Blue - Hover effects, subtle highlights, notification badges, card borders
    600: "#b3d1e6",
    700: "#99bdcf",
    800: "#80a9b8",
    900: "#6695a1",
  },
  background: {
    50: "#ffffff", // Pure white
    100: "#fefefe",
    200: "#fdfdfd",
    300: "#fcfcfc",
    400: "#fbfbfb",
    500: "#ffffff", // Main background color
    600: "#f0f0f0",
    700: "#e1e1e1",
    800: "#d2d2d2",
    900: "#c3c3c3",
  },
  seasalt: {
    50: "#fafbfc", // Lightest seasalt - main background
    100: "#f8f9fa", // Very light seasalt
    200: "#f6f7f8", // Light seasalt
    300: "#f4f5f6", // Medium light seasalt
    400: "#f2f3f4", // Medium seasalt
    500: "#f0f1f2", // Base seasalt - card backgrounds
    600: "#edeef0", // Slightly darker seasalt
    700: "#eaebec", // Darker seasalt
    800: "#e7e8ea", // Much darker seasalt
    900: "#e4e5e7", // Darkest seasalt
  },
  sidebar: {
    dark: "#2E2E30", // Dark sidebar option
    light: "#F7F7F7", // Light sidebar option
  },
  success: {
    50: "#ecfdf3",
    100: "#d1fae1",
    200: "#a7f3c9",
    300: "#6ee7ac",
    400: "#34d399",
    500: "#11acf8",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
};

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
};

// Gradients
export const gradients = {
  subtle: `linear-gradient(to right, ${brandColors.primary[400]}, ${brandColors.secondary[400]})`,
  primary: `linear-gradient(135deg, ${brandColors.primary[500]}, ${brandColors.primary[600]})`, // Blue-purple gradient
  secondary: `linear-gradient(to right, ${brandColors.secondary[500]}, ${brandColors.secondary[600]})`,
  accent: `linear-gradient(135deg, ${brandColors.primary[500]}, ${brandColors.accent[500]})`,
  highlight: `linear-gradient(to right, ${brandColors.primary[500]}, ${brandColors.accent[400]})`,
  glow: `linear-gradient(to right, ${brandColors.primary[400]}, ${brandColors.accent[500]}, ${brandColors.secondary[400]})`,
};

// Animation durations
export const durations = {
  fast: "150ms",
  normal: "250ms",
  slow: "350ms",
};

// Border radiuses
export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
};

// Spacing scale
export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
}; 