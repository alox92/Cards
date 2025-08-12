# 🧭 Guide de Performance & Observabilité

Ce document décrit l'activation et la personnalisation des systèmes de monitoring, de logging avancé et des budgets de performance d'Ariba Flashcards.

## 🔌 Activation des Diagnostics

Variables d'environnement (fichier `.env.local`):
```
VITE_ENABLE_DIAGNOSTICS=true
VITE_ENABLE_LOG_BATCHING=true
```

- `VITE_ENABLE_DIAGNOSTICS` : Affiche le panneau `PerformanceDiagnosticsPanel` même en production.
- `VITE_ENABLE_LOG_BATCHING` : Active le batching des catégories (Transition, FluidTransition).

## 🧪 Panneau Diagnostics
Affiche:
- FPS (avg/min/max) + trend sparkline (50 derniers points)
- Seuil adaptatif actuel & compteur d'adaptations
- Série d'adaptations récentes (timestamp → nouveau seuil)
- Compteurs de suppression de logs (rate-limit)
- Contrôles: Flush batch / Reset suppression

## 🏎️ FPS Monitor Adaptatif
- Abaisse le seuil `warnBelow` par pas de 3 après 5 intervalles consécutifs sous-performants (jusqu'à min 30)
- Historise chaque adaptation (timestamp + nouveau seuil)
- Échantillonnage glissant (sampleSize par défaut 120)

## 📦 Logging & Batching
API clés:
```ts
logger.setBatchingEnabled(true|false)
logger.configureBatch({ categories:["FluidTransition"], flushIntervalMs:4000, maxBatchSize:50 })
logger.getSuppressionSummary()
logger.resetSuppressionCounters()
```

Suppression (rate-limit):
- Clé = level|category|message
- Réémission inclut `_suppressed` dans `data` lors du déblocage

## 🎯 Budgets de Performance
Fichier `src/utils/performanceBudgets.ts` :
```ts
export const PERFORMANCE_BUDGETS = {
  fpsTarget: 60,
  fpsMinAcceptable: 30,
  memorySoftLimitMB: 80,
  memoryHardLimitMB: 120,
  interactionMaxLatencyMs: 120,
  initialLoadMaxMs: 2500
}
```
Fonction `validateBudgets(overrides)` pour contrôle rapide.

Intégration future: instrumentation automatique comparant métriques réelles aux budgets et émission de warnings structurés (catégorie PerformanceBudget).

## 🧷 Feature Flags Centralisés
`src/utils/featureFlags.ts` expose:
```ts
FLAGS.diagnosticsEnabled
FLAGS.logBatchingEnabled
```
Utilisé par le panneau diagnostics & initialisation logger.

## ✅ Bonnes Pratiques d'Activation
- Production: activer diagnostics uniquement sur env staging ou session utilisateur ciblée (ex: paramètre URL ?diag=1).
- Flush manuel avant export de rapports.
- Surveiller la taille de localStorage (logs récents limités à 100 éléments).

## 🛠️ Roadmap Observabilité
- [ ] Export HAR-like des métriques FPS + adaptations
- [ ] Overlay timeline transitions vs FPS
- [ ] Alertes budgets (PerformanceBudget warn/error)
- [ ] Web Worker agrégation métriques longue durée

---
Ce guide évoluera avec l'enrichissement du système de monitoring.
