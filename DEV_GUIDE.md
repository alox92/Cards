# 🛠 Guide Développeur - Cards

## Architecture (Clean-ish)
- application/: Conteneur DI + services (DeckService, CardService, StudySessionService, etc.)
- core/: Systèmes d'optimisation (IntelligentLearningSystem, FluidTransitionMastery, ...)
- data/: Stores Zustand + demoData + accès persistence (IndexedDB via Dexie prévus)
- domain/: Entités & futures interfaces (WIP)
- ui/: Composants React (pages, components, hooks)
- utils/: Logger, performance optimizer, helpers

## Flot d'Initialisation
1. `main.tsx` monte `<App />` via `BrowserRouter` + `ServiceProvider`.
2. `App` exécute initialisation (warmup GPU, chargement settings, demo data).
3. Hooks UI (useApplyDynamicUISettings) appliquent variables CSS.
4. Systèmes (ILS, FluidTransitionMastery) initialisés à la demande (singleton pour ILS).

## Settings Store (Zustand + persist)
Clé: `cards-settings`
Migration ajoute dynamiquement nouvelles propriétés:
```ts
uiScale, accentColor, fontFamily, highContrast,
enable3D, cardFlipSpeedMs, card3DDepth, showStudyTimer,
studyShortcuts, reducedMotionOverride, themePreset, fontWeight
```
Accès:
```ts
const { settings, updateSettings } = useSettingsStore()
updateSettings({ accentColor: '#ff0080' })
```

## Palette HSL Dynamique
Dans `App.tsx` (useEffect dépendant de `settings.accentColor`).
- Convertit hex -> HSL
- Génère nuances `--accent-100..900` (lightness décroissante)
- Stocke h, s, l originaux (`--accent-h/s/l`)

Utilisation Tailwind (exemple via CSS custom):
```css
.bg-accent { background: var(--accent-color); }
.text-accent-700 { color: var(--accent-700); }
```

## Mode Focus
- State persisté: localStorage `cards-focus-mode`
- Masque: Navigation + GlobalSearchBar
- Bouton toggle dans barre supérieure

## Sessions d'Étude
Hook: `useServiceStudySession({ deckId })`
- buildQueue() construit une file (SM-2 via services futurs)
- Persistance session: `cards.activeSession.{deckId}` (queue restante + snapshot session)
- resume() tente restauration au montage
- answer(q) enregistre progression & retire carte

### Bury & Leech
- `SpacedRepetitionService.bury(ids)` enterre les cartes pour la journée (exclues de `getStudyQueue`).
- Détection *leech*: après seuil d'échecs (≥8 revues avec <50% réussite) tag `leech` + report d'une semaine.

### Types de Cartes
- `basic` (par défaut)
- `cloze`: syntaxe `{{c1::texte}}` → masquage, champs stockés: `frontText` masqué + `clozeMap` (index, original)
- `occlusion` (placeholder): `occlusionRegions[]` (x,y,width,height,label) – futur éditeur visuel.

### Recherche
Service `SearchService` (filtrage linéaire): `{ text, deckId, tag, isDue }` + UI `GlobalSearchBar` (filtres Due / Leeches).

### Heatmap Stats
`HeatmapStatsService.getLastNDays(n)` agrège `cardsStudied` par jour (sessions récentes) → composant `StudyHeatmap`.

## IntelligentLearningSystem Singleton
Export utilitaire:
```ts
import { getIntelligentLearningSystem } from '@/core/IntelligentLearningSystem'
const ils = getIntelligentLearningSystem()
```
Évite réinitialisations multiples (logs en double).

## Logger Avancé
Fichier: `utils/logger.ts`
- Niveaux: TRACE..CRITICAL
- Timers: `startTimer(label)` / `endTimer(label)`
- Helper: `loggedPromise(promise, category, description)` (démarrage conditionnel du timer)
- Export des logs: `logger.exportLogs()` (JSON)

## Performance Optimizer
`utils/performanceOptimizer.ts`
- Warmup GPU
- Variants Framer Motion réutilisables
- Styles de performance (`PERFORMANCE_STYLES.base`)

## Ajouts UI Avancés
Hook `useApplyDynamicUISettings` applique via CSS vars:
- --ui-scale, --accent-color, --ui-font-family, --ui-font-weight
- Classes: `.high-contrast`, `.reduced-motion-force`

## Tests
Vitest + React Testing Library.
Commandes:
```bash
npm run test
npm run test:coverage
```

## PWA
- `public/manifest.json` (ajouté 1.1.0)
- Service worker: plugin Vite PWA déjà dans devDependencies (activation future)

## Ajout de Feature Rapide
1. Définir types dans store ou nouvelle entité.
2. Ajouter migration dans persist si clé settings.
3. Créer hook ou service si logique partagée.
4. Mettre à jour UI (page Settings ou composant dédié).
5. Documenter dans CHANGELOG + USER_GUIDE.

## Conventions
- Composants: fonctions, PascalCase, props typées.
- Hooks: prefix `use`, jamais dans conditions.
- Services: injection via container tokens.
- Logs: catégorie concise + émoji optionnel.

## TODO Court Terme
- Service Worker + offline caching sélectif
- SM-2 complet (interval scheduling) dans StudySessionService
- Command Palette
- Export/Import Decks (JSON + media)
- Tests supplémentaires sur hooks services

---
Happy hacking 🚀
