// Design tokens centralisés (Phase 1)
// Objectif: point unique pour couleurs, rayons, ombres, durées animations, easing.
// Futur: pourra être alimenté dynamiquement par les préférences utilisateur / thème.

export const ColorTokens = {
  brand: 'var(--accent-color, #3b82f6)',
  brandSoft: 'var(--accent-300, #93c5fd)',
  surface: 'var(--bg-base, #ffffff)',
  surfaceAlt: 'var(--bg-alt, #f8fafc)',
  border: 'var(--border-color, #e2e8f0)',
  text: 'var(--text-base, #111827)',
  textSoft: 'var(--text-soft, #4b5563)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
} as const

export const RadiusTokens = {
  xs: '3px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  pill: '999px'
} as const

export const ShadowTokens = {
  soft: '0 1px 3px -1px rgba(0,0,0,0.08),0 1px 2px -1px rgba(0,0,0,0.04)',
  medium: '0 4px 10px -2px rgba(0,0,0,0.12),0 2px 4px -2px rgba(0,0,0,0.08)',
  elevated: '0 10px 25px -5px rgba(0,0,0,0.18),0 8px 12px -6px rgba(0,0,0,0.10)'
} as const

export const MotionTokens = {
  duration: {
    micro: 90,
    fast: 160,
    base: 240,
    slow: 380
  },
  ease: {
    standard: [0.4, 0.0, 0.2, 1],
    emphasized: [0.3, 0.7, 0.4, 1],
    entrance: [0.34, 1.56, 0.64, 1],
    exit: [0.4, 0.0, 1, 1]
  }
} as const

export const ZLayers = {
  nav: 50,
  overlay: 90,
  modal: 100,
  toast: 110
} as const

export type RouteCategory = 'learn' | 'create' | 'organize' | 'analyze' | 'system'
