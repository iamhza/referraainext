// Brand colors
export const brandColors = {
  primary: {
    50: "#e6f7fe",
    100: "#cceffd",
    200: "#99dffb",
    300: "#66cff9",
    400: "#33bff7",
    500: "#11ACF8", // Our new brand blue
    600: "#0d8ac6",
    700: "#0a6795",
    800: "#074563",
    900: "#042232",
  },
  secondary: {
    50: "#f0f9ff",
    100: "#e0f4fe",
    200: "#bae3fa",
    300: "#7dcef5",
    400: "#38b6ed",
    500: "#0ca4e4",
    600: "#0282c4",
    700: "#016698",
    800: "#065072",
    900: "#0a3850",
  },
  accent: {
    50: "#eefbff",
    100: "#dcf7ff",
    200: "#b9efff",
    300: "#96e2ff",
    400: "#73d0ff",
    500: "#11ACF8",
    600: "#0088cc",
    700: "#006699",
    800: "#004466",
    900: "#002233",
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
  primary: `linear-gradient(to right, ${brandColors.primary[500]}, ${brandColors.primary[600]})`,
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