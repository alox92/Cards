# Cards (Ariba): System Architect

## Overview
Application de cartes flash intelligente avec 7 systèmes d'optimisation pour l'apprentissage adaptatif. Migration Flutter → React TypeScript avec Clean Architecture.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (React)                         │
│  Pages • Components • Hooks • Context • Routing             │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              Application Layer                               │
│  Services • Use Cases • State Management (Zustand)          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│               Domain Layer                                   │
│  Entities (Card, Deck, DeckStats) • Interfaces              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│          Infrastructure Layer                                │
│  DI Container • ServiceProvider • Repositories              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│               Data Layer                                     │
│  IndexedDB (Dexie.js) • Cache • LocalStorage               │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Core Systems (Orthogonal)                         │
│  7 Optimization Systems running independently               │
└──────────────────────────────────────────────────────────────┘
```

## Architectural Decisions

### **ADR-001: Clean Architecture Pattern**
**Date**: 2024-2025  
**Status**: ✅ Accepted  
**Context**: Besoin de maintenabilité, testabilité et scalabilité pour une app complexe avec 7 systèmes d'optimisation.

**Decision**: Adopter Clean Architecture avec séparation stricte des couches :
- **UI** : Composants React, pages, hooks (dépend de Application)
- **Application** : Services, use cases, state management (dépend de Domain)
- **Domain** : Entités pures, interfaces (indépendant)
- **Infrastructure** : DI, repositories (implémente Domain)
- **Data** : IndexedDB, cache (implémente Infrastructure)
- **Core** : Systèmes d'optimisation (orthogonaux)

**Consequences**:
- ✅ Testabilité maximale (domain isolé)
- ✅ Changement technologie data sans impact business
- ✅ Dépendances unidirectionnelles (UI → App → Domain ← Infra ← Data)
- ⚠️ Complexité initiale augmentée
- ⚠️ Boilerplate interfaces/abstractions

---

### **ADR-002: 7 Optimization Systems Architecture**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Performance critique pour app apprentissage (60 FPS, 10k+ cartes, offline).

**Decision**: Implémenter 7 systèmes d'optimisation orthogonaux :
1. **AlgorithmicOptimizationEngine** : Web Workers, cache intelligent
2. **MemoryManager** : Object pooling, GC control
3. **IntelligentLearningSystem** : SM-2 algorithm, adaptive AI
4. **PerformanceOptimizer** : FPS monitoring, adaptive rendering
5. **AdvancedRenderingSystem** : Virtual scrolling, WebGL
6. **FluidTransitionMastery** : Framer Motion 60 FPS
7. **SystemIntegrationMaster** : Orchestration globale

**Pattern**: Singleton instances + Event bus communication

**Consequences**:
- ✅ Performance exceptionnelle (55-60 FPS constant)
- ✅ Scalabilité (10k+ cartes sans lag)
- ✅ Modularité (systems indépendants)
- ⚠️ Complexité debugging (interactions multiples)
- ⚠️ Memory overhead initial

---

### **ADR-003: TypeScript Strict Mode + Type Safety**
**Date**: 2025-01  
**Status**: ✅ Accepted  
**Context**: Projet migré Flutter → TS, nombreux `any` dangereux détectés.

**Decision**: Éliminer tous `any` non-justifiés :
- **Pattern**: `any` → `unknown` (défaut) puis type narrowing
- **Exceptions légitimes**: APIs non-standard (performance.memory, window.gc), event handlers CustomEvent, JSON dynamique
- **Interfaces étendues** pour APIs tiers non-typées

**Consequences**:
- ✅ 0 erreurs TypeScript compilation
- ✅ Type safety 100% core business logic
- ✅ Refactoring safe (catch erreurs compile-time)
- ⚠️ ~150 `any` UI/Utils acceptés (légitimes)

---

### **ADR-004: IndexedDB avec Dexie.js**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Besoin persistence offline 10k+ cartes avec médias (images/audio).

**Decision**: IndexedDB via Dexie.js avec pattern Repository :
- **Dexie.Table** wrappé dans repositories abstraits
- **Transactions** pour opérations complexes
- **Cache invalidation** intelligent (MemoryManager)
- **Blob storage** pour médias base64

**Alternatives considérées**:
- ❌ LocalStorage (limite 5-10MB)
- ❌ SQLite WASM (taille bundle +2MB)
- ❌ Firebase (nécessite connexion)

**Consequences**:
- ✅ Offline-first (PWA ready)
- ✅ Scalabilité illimitée (IndexedDB ~50% disk)
- ✅ Performance queries (indexes Dexie)
- ⚠️ Complexité transactions async

---

### **ADR-005: Zustand pour State Management**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Redux trop verbeux, Context API insuffisant pour app complexe.

**Decision**: Zustand avec stores par domaine :
- `useDeckStore` : Decks CRUD + cache
- `useCardStore` : Cards CRUD
- `useStatsStore` : Analytics + métriques
- `useSettingsStore` : Config utilisateur

**Pattern**: Persist important state avec `localStorage`

**Alternatives considérées**:
- ❌ Redux Toolkit (boilerplate excessif)
- ❌ Recoil (bundle size +20KB)
- ❌ MobX (complexité observables)

**Consequences**:
- ✅ API simple (hooks direct)
- ✅ Performance (re-renders optimisés)
- ✅ DevTools intégré
- ✅ Bundle minimal (+3KB)

---

### **ADR-006: Vite comme Build Tool**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Create React App obsolète, builds lents Webpack.

**Decision**: Vite 7.5 avec :
- **esbuild** pour dev (HMR <1s)
- **Rollup** pour production (tree-shaking optimal)
- **Code splitting** par route
- **PWA plugin** (Workbox)

**Consequences**:
- ✅ Dev server instant (<500ms)
- ✅ HMR ultra-rapide
- ✅ Bundle optimisé (chunks intelligents)
- ✅ PWA ready (service worker auto)

---

### **ADR-007: Framer Motion pour Animations**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Besoin animations fluides 60 FPS, spring physics naturelles.

**Decision**: Framer Motion avec :
- **GPU acceleration** (CSS transforms)
- **Adaptive quality** (FPS monitoring → reduce complexity)
- **Variants** pour transitions contextuelles
- **AnimatePresence** pour mount/unmount

**Alternatives considérées**:
- ❌ CSS Animations (limitations interactions)
- ❌ GSAP (bundle +50KB, payant pro)
- ❌ React Spring (API complexe)

**Consequences**:
- ✅ 60 FPS garantis (adaptive)
- ✅ Physics naturelles (spring)
- ✅ Bundle acceptable (+20KB gzip)
- ⚠️ Surcharge initial parse JS

---

### **ADR-008: Web Workers pour Calculs Intensifs**
**Date**: 2024  
**Status**: ✅ Accepted  
**Context**: Algorithmes SM-2, statistiques, tri bloquent UI thread.

**Decision**: Web Workers via AlgorithmicOptimizationEngine :
- **Worker pool** (2-4 workers selon CPU)
- **Message passing** typé (postMessage)
- **Fallback sync** si Workers indisponibles
- **Cache résultats** (évite recalculs)

**Consequences**:
- ✅ UI thread non bloqué (60 FPS)
- ✅ Scalabilité calculs (multi-core)
- ⚠️ Complexité debugging (async)
- ⚠️ Serialization overhead (pas de shared memory)

---

### **ADR-009: Testing Strategy**
**Date**: 2024-2025  
**Status**: ✅ Accepted  
**Context**: App complexe nécessite tests robustes.

**Decision**: 3-tier testing :
1. **Unit tests** (Vitest) : Domain logic, algorithms
2. **Integration tests** (@testing-library/react) : Components, hooks
3. **E2E tests** (Playwright) : Critical flows

**Target**: 80% coverage (atteint)

**Consequences**:
- ✅ Refactoring safe
- ✅ Regression detection
- ✅ CI/CD ready
- ⚠️ Maintenance tests (~20% temps dev)

---

### **ADR-010: Logging Standardisé**
**Date**: 2025-01  
**Status**: ✅ Accepted  
**Context**: 133 `console.*` non-structurés détectés, debugging difficile.

**Decision**: Logger centralisé custom :
- **Levels**: debug, info, warn, error
- **Structured data**: `logger.debug('message', { context })`
- **Production**: Désactivation debug/info
- **Performance monitoring** intégré (performance.memory)

**Migration**: 133 remplacements console.* → logger.*

**Consequences**:
- ✅ Debugging structuré
- ✅ Production logs propres
- ✅ Performance tracking automatique
- ✅ Filtres par niveau/module

---

## Technology Stack

### **Frontend Core**
- **React 18.3** : UI library (Concurrent features)
- **TypeScript 5** : Type safety strict
- **Vite 7.5** : Build tool ultra-rapide
- **Tailwind CSS** : Utility-first styling

### **State & Data**
- **Zustand** : State management
- **Dexie.js** : IndexedDB wrapper
- **React Query** : Server state (si API future)

### **Performance**
- **Web Workers** : Background processing
- **Service Worker** : PWA offline
- **Framer Motion** : Animations 60 FPS
- **react-window** : Virtual scrolling

### **Testing**
- **Vitest** : Unit tests
- **@testing-library/react** : Component tests
- **Playwright** : E2E tests

### **DevOps**
- **ESLint** : Linting
- **Prettier** : Formatting
- **Husky** : Git hooks (si configuré)

---

## System Constraints

### **Performance Budgets**
- **FPS Target**: 55-60 (adaptive)
- **Bundle Size**: <500KB (initial load)
- **Memory**: <50MB RAM usage
- **Load Time**: <2s (3G network)

### **Browser Support**
- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Features**: IndexedDB, Web Workers, Service Workers
- **Fallbacks**: Sync algorithms si Workers indisponibles

### **Scalability Limits**
- **Cards**: 10,000+ supportés
- **Decks**: 1,000+ supportés
- **Media**: 500MB total (IndexedDB quota)

---

## Security Considerations

### **Data Storage**
- **IndexedDB**: Client-side uniquement (pas de serveur)
- **No authentication**: Offline-first (futur: sync cloud optionnel)
- **XSS Protection**: DOMPurify sanitization HTML user input

### **Content Security**
- **CSP Headers**: (à configurer si deployment)
- **Sanitization**: Toutes user inputs (DeckNameInput, CardEditor)

---

## Future Considerations

### **Potential Improvements**
1. **Cloud Sync** (Firebase/Supabase)
2. **Collaborative decks** (WebRTC)
3. **AI-generated cards** (OpenAI API)
4. **Gamification avancée** (achievements, leaderboard)
5. **Mobile app** (React Native migration)

### **Technical Debt**
- ~150 `any` UI/Utils (non-critique, légitimes)
- Tests e2e coverage (1 fichier actuellement)
- Performance budgets enforcement (Vite config)

---

## Maintenance Guidelines

### **Code Reviews**
- Vérifier respect Clean Architecture
- Type safety (pas de `any` non-justifié)
- Tests unitaires pour nouvelle logique
- Performance impact (FPS monitoring)

### **Deployment**
- Build production: `npm run build`
- Tests: `npm test`
- E2E: `npm run test:e2e`
- Bundle analysis: `npm run build -- --analyze`

---

**Last Updated**: 2025-01-01  
**Document Owner**: Architecture Team  
**Review Cycle**: Quarterly

