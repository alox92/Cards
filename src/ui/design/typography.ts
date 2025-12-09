/**
 * Échelle Typographique - Ariba Flashcards
 * Hiérarchie visuelle claire et cohérente
 */

export const typography = {
  // Titres display (hero, landing pages)
  display: {
    xl: "text-6xl font-extrabold tracking-tight leading-none", // 60px
    lg: "text-5xl font-extrabold tracking-tight leading-tight", // 48px
    md: "text-4xl font-bold tracking-tight leading-tight", // 36px
  },

  // Titres de section (h1-h4)
  heading: {
    h1: "text-3xl font-bold leading-tight", // 30px
    h2: "text-2xl font-bold leading-snug", // 24px
    h3: "text-xl font-semibold leading-snug", // 20px
    h4: "text-lg font-semibold leading-normal", // 18px
    h5: "text-base font-semibold leading-normal", // 16px
    h6: "text-sm font-semibold leading-normal", // 14px
  },

  // Corps de texte
  body: {
    large: "text-lg leading-relaxed", // 18px
    base: "text-base leading-normal", // 16px
    small: "text-sm leading-normal", // 14px
    xs: "text-xs leading-normal", // 12px
  },

  // Labels et boutons
  label: {
    large: "text-sm font-medium uppercase tracking-wide",
    base: "text-xs font-medium uppercase tracking-wide",
    small: "text-xs font-bold uppercase tracking-wider",
  },

  // Code et monospace
  code: {
    inline:
      "font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded",
    block: "font-mono text-sm leading-relaxed",
  },

  // Utilitaires
  truncate: "truncate",
  ellipsis: "line-clamp-2",
  noWrap: "whitespace-nowrap",
} as const;

// Export types
export type TypographyDisplaySize = keyof typeof typography.display;
export type TypographyHeadingSize = keyof typeof typography.heading;
export type TypographyBodySize = keyof typeof typography.body;
export type TypographyLabelSize = keyof typeof typography.label;
