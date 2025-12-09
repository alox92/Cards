# Guide de Test - Cards

Ce document détaille l'infrastructure de test de l'application Cards, conçue pour garantir la fiabilité, la performance et la maintenabilité d'un outil d'apprentissage professionnel.

## 🏗️ Architecture des Tests

Nous utilisons **Vitest** comme framework de test principal, configuré pour supporter des tests unitaires rapides et des tests d'intégration plus lourds.

### Types de Tests

1.  **Tests Unitaires (`*.test.ts`, `*.test.tsx`)**

    - Testent des fonctions isolées, des hooks ou des composants simples.
    - Doivent être rapides (< 10ms).
    - Mockent les dépendances externes (IndexedDB, API).

2.  **Tests d'Intégration (`*.integration.test.ts`)**

    - Testent des flux complets (ex: Création de deck -> Ajout carte -> Étude).
    - Utilisent une base de données IndexedDB en mémoire (`fake-indexeddb`).
    - Vérifient la cohérence des données.

3.  **Tests de Performance (`*.perf.test.ts`, `*.heavy.test.ts`)**

    - Vérifient les limites du système (ex: 5000 cartes, 100 ops/sec).
    - Sont exclus du mode "Fast" par défaut.

4.  **Tests Critiques (`critical.*.test.ts`)**
    - Une suite spéciale qui valide les fonctionnalités vitales de l'application.
    - Doivent TOUJOURS passer avant un commit.

## 🚀 Exécution des Tests

### Commandes Principales

| Commande                | Description                                          | Usage                   |
| :---------------------- | :--------------------------------------------------- | :---------------------- |
| `npm test`              | Lance tous les tests (mode par défaut).              | CI / Validation finale  |
| `npm run test:fast`     | Lance uniquement les tests rapides (exclut `heavy`). | Développement quotidien |
| `npm run test:ui`       | Ouvre l'interface graphique Vitest.                  | Debugging visuel        |
| `npm run test:coverage` | Génère un rapport de couverture complet.             | Audit qualité           |

### Modes d'Exécution

Le fichier `vitest.config.ts` gère intelligemment les modes via des variables d'environnement :

- **Mode Fast (`FAST_TESTS='1'`)** :

  - Exclut `src/**/*.heavy.test.ts` et `src/**/*.heavy.test.tsx`.
  - Filtre les logs verbeux (`debug`, `trace`).
  - Optimisé pour le feedback immédiat.

- **Mode CI (`CI='1'`)** :
  - Active le reporter JUnit pour l'intégration Jenkins/GitHub Actions.
  - Force l'exécution de tous les tests.

## 📊 Couverture de Code

Nous maintenons des standards de qualité élevés avec des seuils de couverture stricts (80%).

**Configuration (`vitest.config.ts`)** :

```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80
}
```

Les rapports sont générés dans le dossier `coverage/` aux formats :

- `text` (console)
- `json-summary` (pour les badges)
- `lcov` (pour SonarQube/Codecov)
- `html` (pour visualisation locale)

## 🛠️ Environnement de Test

L'environnement est configuré dans `src/__tests__/setupTestEnv.ts` :

- **DOM** : `jsdom` simule le navigateur.
- **IndexedDB** : `fake-indexeddb` fournit une implémentation complète en mémoire.
- **Mocks Globaux** :
  - `ResizeObserver`
  - `matchMedia`
  - `Blob.arrayBuffer`
- **Vitest Globals** : `vi` est utilisé pour les mocks (remplace `jest`).

## 📝 Bonnes Pratiques

1.  **Utilisez `vi.fn()`** au lieu de `jest.fn()`.
2.  **Nettoyez les mocks** après chaque test (automatique via `restoreMocks: true` si configuré, sinon `afterEach`).
3.  **Nommez les fichiers** explicitement :
    - `MyComponent.test.tsx` pour les composants.
    - `myService.test.ts` pour la logique métier.
    - `feature.integration.test.ts` pour les flux.
4.  **Performance** : Si un test prend > 100ms, marquez-le comme `heavy` ou optimisez-le.

## 🔍 Debugging

Si un test échoue :

1.  Lisez le message d'erreur complet.
2.  Utilisez `console.log` (filtré en mode fast, visible en mode normal).
3.  Lancez `npm run test:ui` pour voir l'état du DOM et des composants.
