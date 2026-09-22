/**
 * Terpa App Color System
 *
 * This file defines the color system for the Terpa app, including:
 * - ColorScheme type for light/dark mode
 * - ColorPalette interface defining all available colors
 * - Base colors shared between themes
 * - Light and dark theme color palettes
 *
 * Usage:
 * 1. For theme-aware components, use the useTheme() hook:
 *    const theme = useTheme();
 *    theme.colors.primary.main
 *
 * 2. For direct color access, use the useColors() hook:
 *    const colors = useColors();
 *    colors.primary.main
 *
 * 3. For specific color needs, use the useThemeColor() hook:
 *    const color = useThemeColor({ light: '#fff', dark: '#000' }, 'primary');
 */

export type ColorScheme = "light" | "dark";

export interface ColorPalette {
  // Brand colors
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  // Feedback colors
  success: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  info: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  warning: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  error: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  // Tailwind color palettes
  emerald: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  red: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  orange: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  blue: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  yellow: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  purple: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  // Neutral colors
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    secondary2: string;
    disabled: string;
    hint: string;
    dark: string;
    subtle: string;
  };
  // Background colors
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  tab: {
    background: string;
    text: {
      primary: string;
      secondary: string;
    };
  };
  // Status colors (semantic)
  status: {
    online: string;
    offline: string;
    warning: string;
  };
  // Status text colors (for labels)
  statusText: {
    online: string;
    offline: string;
    warning: string;
  };
  // Special colors
  favorite: string;
  divider: string;
  backdrop: string;
  white: string;
  black: string;
  transparent: string;
  // New semantic colors
  inputBackground: string;
  icon: string;
  activityIndicator: string;
  border: string;
}

// Define base colors - shared between themes
// Using Tailwind CSS color palette for consistency with web app
const baseColors = {
  primary: {
    main: "#000",
    light: "rgba(2, 128, 122, 0.2)",
    dark: "#016961",
    contrast: "#ffffff",
  },
  secondary: {
    main: "#f34f4f",
    light: "rgba(243, 79, 79, 0.2)",
    dark: "#c43c3c",
    contrast: "#ffffff",
  },
  success: {
    main: "#10b981", // Tailwind emerald-500 (used for progress bars 60-100%)
    light: "rgba(16, 185, 129, 0.2)",
    dark: "#059669", // Tailwind emerald-600
    contrast: "#ffffff",
  },
  info: {
    main: "#4f86f4",
    light: "rgba(79, 134, 244, 0.2)",
    dark: "#3a63b8",
    contrast: "#ffffff",
  },
  warning: {
    main: "#f97316", // Tailwind orange-500 (matches web app)
    light: "rgba(249, 115, 22, 0.2)",
    dark: "#ea580c", // Tailwind orange-600
    contrast: "#ffffff",
  },
  error: {
    main: "#ef4444", // Tailwind red-500 (matches web app)
    light: "rgba(239, 68, 68, 0.2)",
    dark: "#dc2626", // Tailwind red-600
    contrast: "#ffffff",
  },
  // Tailwind color palettes (full spectrum for consistency with web)
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  red: {
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
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
  // Semantic status colors (separate from feedback colors)
  status: {
    online: "#059669", // Tailwind emerald-600 (matches web online indicator)
    offline: "#ef4444", // Tailwind red-500
    warning: "#f97316", // Tailwind orange-500
  },
  favorite: "#FCE37D",
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
};

// Light theme color palette
export const lightColors: ColorPalette = {
  ...baseColors,
  primary: {
    main: "#000",
    light: "rgba(2, 128, 122, 0.2)",
    dark: "#016961",
    contrast: "#ffffff",
  },
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  text: {
    primary: "#000",
    secondary: "#00000080",
    secondary2: "#6C757D",
    disabled: "#9E9E9E",
    hint: "#6C757D",
    dark: "#000000",
    subtle: "#6C757D",
  },
  background: {
    default: "#F9FAFB",
    paper: "#ffffff",
    elevated: "#ffffff",
  },
  tab: {
    background: "#FFF",
    text: {
      primary: "#000",
      secondary: "#00000080",
    },
  },
  statusText: {
    online: "#047857", // Tailwind emerald-700 (matches web light mode)
    offline: "#dc2626", // Tailwind red-600
    warning: "#a16207", // Tailwind yellow-700
  },
  divider: "#E0E0E0",
  backdrop: "rgba(0, 0, 0, 0.5)",
  inputBackground: "#FFF",
  icon: "#1C1F21",
  activityIndicator: "#6B7280",
  border: "#E0E0E0",
};

// Dark theme color palette
export const darkColors: ColorPalette = {
  ...baseColors,
  primary: {
    main: "#ffffff",
    light: "rgba(255, 255, 255, 0.2)",
    dark: "#e5e5e5",
    contrast: "#000000",
  },
  gray: {
    50: "#18191A",
    100: "#242526",
    200: "#3A3B3C",
    300: "#4E4F50",
    400: "#6A6B6C",
    500: "#8A8B8C",
    600: "#AAABAC",
    700: "#CCCDCE",
    800: "#EEEFF0",
    900: "#F5F6F7",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#B0B3B8",
    secondary2: "#8A8D91",
    disabled: "#6C6C6C",
    hint: "#8A8D91",
    dark: "#FFFFFF",
    subtle: "#8A8D91",
  },
  background: {
    default: "#222222",
    paper: "#242526",
    elevated: "#3A3B3C",
  },
  tab: {
    background: "#222222",
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B3B8",
    },
  },
  statusText: {
    online: "#34d399", // Tailwind emerald-400 (matches web dark mode)
    offline: "#f87171", // Tailwind red-400
    warning: "#facc15", // Tailwind yellow-400
  },
  divider: "#3A3B3C",
  backdrop: "rgba(0, 0, 0, 0.5)",
  inputBackground: "#3A3B3C",
  icon: "#FFFFFF",
  activityIndicator: "#8A8D91",
  border: "#3A3B3C",
};

const tintColorLight = "#ef3e55";
const tintColorDark = "#fff";

export { tintColorLight, tintColorDark };
