# Copilot Instructions pour Ariba Flashcards

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## 🎯 Contexte du Projet

Ariba Flashcards est une application de cartes flash intelligente migrée de Flutter vers React TypeScript. L'application implémente 7 systèmes d'optimisation révolutionnaires pour l'apprentissage adaptatif.

## 🏗️ Architecture

Le projet suit les principes de Clean Architecture avec les couches suivantes :
- **Core** : 7 systèmes d'optimisation (AdvancedRenderingSystem, AlgorithmicOptimizationEngine, etc.)
- **Data** : Repositories, IndexedDB avec Dexie.js, cache management
- **Domain** : Entités (Card, Deck, DeckStats), use cases, interfaces
- **UI** : Composants React, pages, hooks personnalisés
- **Utils** : Algorithmes d'apprentissage, helpers, utilitaires

## 🧠 Systèmes d'Optimisation

1. **AdvancedRenderingSystem** : Performance de rendu, WebGL, animations optimisées
2. **AlgorithmicOptimizationEngine** : Algorithmes de tri, Web Workers, cache intelligent
3. **PerformanceOptimizer** : Monitoring temps réel, métriques FPS, optimisation mémoire
4. **SystemIntegrationMaster** : Orchestration globale des 7 systèmes
5. **IntelligentLearningSystem** : IA d'apprentissage, répétition espacée SM-2
6. **FluidTransitionMastery** : Animations fluides, transitions contextuelles
7. **MemoryManager** : Gestion intelligente du cache, préchargement adaptatif

## 📊 Entités Principales

- **Card** : frontText, backText, images, audio, tags, difficulty, SM-2 algorithm data
- **Deck** : Collection de cartes avec métadonnées et statistiques
- **DeckStats** : Analytics détaillées, métriques de performance

## 🎮 Modes d'Étude

- **Quiz Mode** : Questions à choix multiples avec feedback
- **Speed Round** : Sessions chronométrées avec scoring
- **Matching Game** : Glisser-déposer pour associations
- **Writing Practice** : Saisie manuelle avec vérification

## 🛠️ Stack Technologique

- **Framework** : React 18 + TypeScript
- **Build Tool** : Vite
- **Database** : IndexedDB avec Dexie.js
- **State Management** : Zustand
- **UI Framework** : Tailwind CSS
- **Animations** : Framer Motion
- **Charts** : Chart.js + react-chartjs-2
- **Testing** : Vitest + @testing-library/react
- **PWA** : Workbox + Vite PWA plugin

## 📝 Conventions de Code

### Composants React
- Utilisez TypeScript avec interfaces strictes
- Préférez les functional components avec hooks
- Props destructuring avec types explicites
- Gestion d'erreur avec ErrorBoundary

### State Management
- Zustand stores par domaine (deck, card, stats, settings)
- Actions async avec gestion d'erreur
- Persist important state avec localStorage

### Performance
- Lazy loading des composants lourds
- Mémorisation avec useMemo/useCallback
- Virtual scrolling pour les grandes listes
- Web Workers pour calculs intensifs

### Base de Données
- Dexie.js pour IndexedDB
- Repositories pattern pour l'abstraction
- Transactions pour les opérations complexes
- Cache intelligent avec invalidation

### Testing
- Tests unitaires pour la logique métier
- Tests d'intégration pour les composants
- Tests e2e pour les workflows critiques
- Coverage minimum 80%

## 🎨 Design Guidelines

- Design system cohérent avec Tailwind
- Responsive design (mobile-first)
- Accessibilité WCAG 2.1 AA
- Dark/light theme support
- Animations fluides mais subtiles

## 📈 Algorithmes d'Apprentissage

- **SM-2 Spaced Repetition** : easinessFactor, interval calculation
- **Performance Tracking** : success rate, study time, streak analysis
- **Adaptive Difficulty** : Dynamic adjustment based on user performance
- **Predictive Analytics** : Retention prediction, optimal review timing

## 🔧 Optimisations Spécifiques

- Bundle splitting par route
- Image optimization et lazy loading
- Service Worker pour cache offline
- IndexedDB optimization patterns
- Memory leak prevention
- Performance monitoring avec Web APIs

Suivez ces instructions pour maintenir la cohérence et la qualité du code dans le projet Ariba Flashcards.
