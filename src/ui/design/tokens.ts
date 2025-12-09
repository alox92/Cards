/**
 * Système de Design Tokens - Ariba Flashcards
 * Tokens centralisés pour cohérence visuelle et accessibilité WCAG 2.1 AA
 */

// ============================================
// COULEURS - Palette complète avec contrastes validés
// ============================================
export const ColorTokens = {
  // Primaires
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Base
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  // Secondaires
  secondary: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7", // Base
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764",
  },
  // États sémantiques
  success: {
    DEFAULT: "#10b981",
    hover: "#059669",
    light: "#d1fae5",
    dark: "#065f46",
  },
  warning: {
    DEFAULT: "#f59e0b",
    hover: "#d97706",
    light: "#fef3c7",
    dark: "#92400e",
  },
  error: {
    DEFAULT: "#ef4444",
    hover: "#dc2626",
    light: "#fee2e2",
    dark: "#991b1b",
  },
  info: {
    DEFAULT: "#3b82f6",
    hover: "#2563eb",
    light: "#dbeafe",
    dark: "#1e40af",
  },
  // Neutrals avec contrastes WCAG AA
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280", // Contraste 4.6:1 ✓
    600: "#4b5563", // Contraste 7:1 ✓
    700: "#374151", // Contraste 10:1 ✓
    800: "#1f2937",
    900: "#111827", // Contraste 17:1 ✓
    950: "#030712",
  },
} as const;

// Alias sémantiques (backward compatibility)
export const LegacyColorTokens = {
  brand: "#3b82f6",
  brandSoft: "#93c5fd",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  border: "#e2e8f0",
  text: "#111827",
  textSoft: "#4b5563",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

// ============================================
// BORDER RADIUS - Échelle cohérente
// ============================================
export const RadiusTokens = {
  none: "0",
  xs: "3px",
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "16px",
  "2xl": "24px",
  pill: "999px",
  full: "9999px",
} as const;

// ============================================
// OMBRES - Élévation progressive
// ============================================
export const ShadowTokens = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  soft: "0 1px 3px -1px rgba(0,0,0,0.08),0 1px 2px -1px rgba(0,0,0,0.04)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  medium: "0 4px 10px -2px rgba(0,0,0,0.12),0 2px 4px -2px rgba(0,0,0,0.08)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  elevated:
    "0 10px 25px -5px rgba(0,0,0,0.18),0 8px 12px -6px rgba(0,0,0,0.10)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  glow: "0 0 20px rgb(59 130 246 / 0.5)",
  glowPurple: "0 0 20px rgb(168 85 247 / 0.5)",
} as const;

// ============================================
// TRANSITIONS - Timing optimisé
// ============================================
export const MotionTokens = {
  duration: {
    instant: 80,
    micro: 90,
    fast: 160,
    base: 240,
    slow: 380,
    slower: 500,
  },
  ease: {
    standard: [0.4, 0.0, 0.2, 1] as const,
    emphasized: [0.3, 0.7, 0.4, 1] as const,
    entrance: [0.34, 1.56, 0.64, 1] as const,
    exit: [0.4, 0.0, 1, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
  },
  // Strings CSS pour usage direct
  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

// ============================================
// Z-INDEX - Layering
// ============================================
export const ZLayers = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  nav: 50,
  overlay: 90,
  modalBackdrop: 1040,
  modal: 100,
  popover: 1060,
  tooltip: 1070,
  toast: 110,
} as const;

// ============================================
// ESPACEMENT - Échelle 4pt
// ============================================
export const SpacingTokens = {
  0: "0",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
} as const;

export type RouteCategory =
  | "learn"
  | "create"
  | "organize"
  | "analyze"
  | "system";
