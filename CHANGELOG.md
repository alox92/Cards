# 📦 Changelog - Cards

Toutes les évolutions notables du projet. Format inspiré de Keep a Changelog.

## [Unreleased]
- (Prévu) Service Worker complet + background sync
- (Prévu) Command Palette (Ctrl+/)
- (Prévu) Export/Import avancé des données utilisateur
### Ajouté
- Support carte Cloze (parser {{cN::...}} + aperçu UI)
- Détection Leech (tag automatique + report interval)
- Fonction Bury (exclut les cartes de la file du jour)
- Service de recherche unifié (filters: deck, tag, due, leech) + intégration barre globale
- Heatmap d'activité (révisions/jour sur 120+ jours)
- Placeholder Image Occlusion (structure occlusionRegions + UI basique)
### Tech
- Extension CardEntity: cardType, clozeMap, occlusionRegions
- Services ajoutés: SearchService, HeatmapStatsService
- Tests unitaires: clozeParser, SRS leech/bury, search, heatmap
### Modifié
- Interface principale modernisée : barre "Command Center" en verre fluide (stats, actions rapides, recherche) + transitions `framer-motion` harmonisées.
- `RouteTransitionLayer` : animations plus douces, support `prefers-reduced-motion`, barre de chargement autonome.
- Application des palettes thème/accent déléguée aux tâches inactives (`scheduleIdle`) pour réduire les pics de rendu.
- Widget de statistiques globales enrichi (KPI supplémentaires, skeleton, rafraîchissement manuel, intégration focus-mode).

## [1.1.0] - 2025-08-11
### Ajouté
- Reprise automatique des sessions d'étude (persistées par deck `cards.activeSession.{deckId}`)
- Timer d'étude temps réel (rendu via `requestAnimationFrame`)
- Raccourcis clavier en session: `Space` flip, `0–4` qualité SM‑2
- Flip 3D des cartes: profondeur (`card3DDepth`) & vitesse (`cardFlipSpeedMs`) configurables
- Mode Focus persistant (`cards-focus-mode`): masque navigation + barre de recherche
- Génération dynamique de palette **HSL** (variables `--accent-100..900` + `--accent-h/s/l`)
- Presets de thèmes: Solarized / Nord / Dracula / Gruvbox
- Variable globale de poids typographique (`--ui-font-weight`) + réglage dans paramètres
- Zoom UI global (`--ui-scale`)
- Réglages UI avancés (accent, police, contraste, motion, 3D)
- Manifest PWA valide (icônes multiples, theme & background color)
- Singleton pour `IntelligentLearningSystem` (évite ré-initialisations multiples)
- Documentation: mise à jour `USER_GUIDE.md` + ce `CHANGELOG.md`

### Modifié
- Palette RGB lighten/darken remplacée par algorithme HSL stable
- `useServiceStudySession` accepte `deckId?` pour maintenir l'ordre des hooks
- `loggedPromise` évite warnings “Timer non trouvé” (vérification existence)
- Mise à jour `BrowserRouter` avec flags v7 (`v7_startTransition`, `v7_relativeSplatPath`)

### Corrigé
- Avertissement React "Rendered more hooks" sur `StudyPage` (hook conditionnel supprimé)
- Multiples initialisations / nettoyages de l'IntelligentLearningSystem
- Erreur de manifest (JSON manquant) causant warning navigateur

### Retiré
- Ancienne génération de palette basée sur multiplicateurs RGB

### Tech / Interne
- Ajout CSS vars: `--accent-*`, `--ui-scale`, `--ui-font-family`, `--ui-font-weight`
- Persistence étendue dans le store settings (fontWeight, themePreset)

## [1.0.0] - Initial
- Base application, services, systèmes d'optimisation, gamification, stats.

---

Legend: Added | Modified | Fixed | Removed | Internal
