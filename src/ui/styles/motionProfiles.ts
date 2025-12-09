import type { Transition } from "framer-motion";

// Profils de transitions centralisés pour garder un comportement cohérent
// et pouvoir réagir aux classes globales (calm-ui, berserk-ui, reduced-motion-force).

type MotionMode = "default" | "calm" | "berserk" | "reduced";

function getMotionMode(): MotionMode {
  if (typeof document === "undefined") return "default";
  const classes = document.documentElement.classList;
  if (classes.contains("reduced-motion-force")) return "reduced";
  if (classes.contains("calm-ui")) return "calm";
  if (classes.contains("berserk-ui")) return "berserk";
  return "default";
}

// Transition principale pour les flips de cartes
export function getFlipTransition(): Transition {
  const mode = getMotionMode();
  switch (mode) {
    case "reduced":
      return {
        duration: 0.15,
        ease: "linear",
      };
    case "calm":
      return {
        duration: 0.24,
        ease: [0.25, 0.8, 0.25, 1],
      };
    case "berserk":
      return {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      };
    default:
      // Profil par défaut: rapide mais fluide
      return {
        duration: 0.2,
        ease: [0.33, 1, 0.68, 1],
      };
  }
}

// Spring interactif pour les hover / tap sur cartes
export function getInteractiveSpring(): Transition {
  const mode = getMotionMode();
  switch (mode) {
    case "reduced":
      return {
        duration: 0.18,
        ease: "easeOut",
      };
    case "calm":
      return {
        type: "spring",
        stiffness: 220,
        damping: 30,
        mass: 0.9,
      };
    case "berserk":
      return {
        type: "spring",
        stiffness: 340,
        damping: 26,
        mass: 0.8,
      };
    default:
      return {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.85,
      };
  }
}

// Transition générique pour les entrées/sorties de pages et gros panels
export function getPageTransition(): Transition {
  const mode = getMotionMode();
  switch (mode) {
    case "reduced":
      return {
        duration: 0.15,
        ease: "linear",
      };
    case "calm":
      return {
        duration: 0.35,
        ease: [0.25, 0.8, 0.4, 1],
      };
    case "berserk":
      return {
        duration: 0.45,
        ease: [0.18, 0.9, 0.3, 1],
      };
    default:
      return {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      };
  }
}

// Variante pratique pour les sections héro / modules avec délai configurable
export function getHeroTransition(delay = 0): Transition {
  const base = getPageTransition();
  return {
    ...base,
    delay,
  };
}
