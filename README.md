# 🚀 Cards - Application Intelligente d'Apprentissage

Application de cartes flash avancée avec **7 systèmes d'optimisation** pour l'apprentissage adaptatif. Migrée de Flutter vers React TypeScript pour une expérience web moderne et performante.

![Cards Banner](https://img.shields.io/badge/Cards-Flashcards-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Fonctionnalités Principales

### 🧠 7 Systèmes d'Optimisation Révolutionnaires

1. **🎨 Advanced Rendering System** - Performance de rendu optimisée avec WebGL
2. **🧠 Algorithmic Optimization Engine** - Algorithmes d'IA avec Web Workers
3. **⚡ Performance Optimizer** - Monitoring temps réel des métriques
4. **🎯 System Integration Master** - Orchestration globale des systèmes
5. **📚 Intelligent Learning System** - IA d'apprentissage adaptatif
6. **🌊 Fluid Transition Mastery** - Animations fluides avancées
7. **💾 Memory Manager** - Gestion intelligente de la mémoire

### 🎮 Modes d'Étude Interactifs

- **📝 Quiz Mode** - Questions à choix multiples avec feedback intelligent
- **⚡ Speed Round** - Sessions chronométrées avec scoring en temps réel
- **🎯 Matching Game** - Glisser-déposer pour associations visuelles
- **✍️ Writing Practice** - Saisie manuelle avec vérification automatique

### 📊 Analytics Avancées

- Algorithme de répétition espacée (SM-2)
- Tableaux de bord personnalisés
- Métriques de progression détaillées
- Prédiction de rétention
- Heatmap d'activité quotidienne
- Détection Leech & fonction Bury
- Recherche avancée (deck, tag, cartes dues, leeches)
- Cartes Cloze (masques dynamiques)

## 🛠️ Stack Technologique

| Technologie | Version | Description |
|-------------|---------|-------------|
| **React** | 18.2+ | Framework UI moderne |
| **TypeScript** | 5.0+ | Typage statique |
| **Vite** | 4.4+ | Build tool ultra-rapide |
| **Tailwind CSS** | 3.3+ | Framework CSS utilitaire |
| **Framer Motion** | 10.16+ | Animations fluides |
| **Dexie.js** | 3.2+ | Base de données IndexedDB |
| **Zustand** | 4.4+ | State management léger |
| **Chart.js** | 4.4+ | Graphiques interactifs |
| **Vitest** | 0.34+ | Framework de test |

## 🚀 Installation et Configuration

### Prérequis

Assurez-vous d'avoir **Node.js** installé sur votre système :

1. **Téléchargez Node.js** : https://nodejs.org/
2. **Installez la version LTS** (recommandée)
3. **Vérifiez l'installation** :
   ```bash
   node --version
   npm --version
   ```

### Installation des Dépendances

```bash
# Cloner le projet (si depuis un repo)
git clone <repository-url>
cd cards

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000 dans votre navigateur
```

### Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualisation du build

# Tests
npm run test         # Tests unitaires
npm run test:ui      # Interface de test
npm run test:coverage # Couverture de code

# Qualité du code
npm run lint         # Linting ESLint
npm run typecheck    # Vérification TypeScript
```

## 🏗️ Architecture du Projet

```
src/
├── core/                    # 🧠 Systèmes d'optimisation
│   ├── AdvancedRenderingSystem.ts
│   ├── AlgorithmicOptimizationEngine.ts
│   ├── PerformanceOptimizer.ts
│   ├── SystemIntegrationMaster.ts
│   ├── IntelligentLearningSystem.ts
│   ├── FluidTransitionMastery.ts
│   └── MemoryManager.ts
├── data/                    # 💾 Couche de données
│   ├── database/           # IndexedDB avec Dexie
│   ├── repositories/       # Accès aux données
│   └── stores/            # State management
├── domain/                  # 🎯 Logique métier
│   ├── entities/          # Modèles (Card, Deck, Stats)
│   ├── usecases/          # Cas d'usage
│   └── services/          # Services métier
├── ui/                     # 🎨 Interface utilisateur
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages principales
│   ├── hooks/            # Hooks personnalisés
│   └── styles/           # Styles globaux
└── utils/                  # 🛠️ Utilitaires
    ├── algorithms/        # Algorithmes d'apprentissage
    ├── helpers/          # Fonctions utilitaires
    └── constants/        # Constantes
```

## 📊 Modèle de Données

### 🃏 Card (Carte Flash)
```typescript
interface Card {
  id: number
  deckId: number
  frontText: string
  backText: string
  frontImage?: string
  backImage?: string
  frontAudio?: string
  backAudio?: string
  tags: string
  difficulty: number
  lastReviewed?: Date
  reviewCount: number
  easinessFactor: number
  repetitions: number
  intervalDays: number
  nextReviewDate?: Date
  createdAt: Date
  updatedAt: Date
}
```

### 📚 Deck (Paquet de Cartes)
```typescript
interface Deck {
  id: number
  name: string
  description: string
  coverImage?: string
  category: string
  difficulty: string
  tags: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  cards?: Card[]
  stats?: DeckStats
}
```

### 📈 DeckStats (Statistiques)
```typescript
interface DeckStats {
  id: number
  deckId: number
  totalCards: number
  studiedCards: number
  masteredCards: number
  averageScore: number
  totalStudyTime: number
  lastStudyDate: Date
  studyStreak: number
  createdAt: Date
  updatedAt: Date
}
```

## 🎯 Algorithme d'Apprentissage

Cards utilise l'algorithme **SM-2 (SuperMemo)** optimisé pour la répétition espacée :

- **Facteur de facilité** adaptatif selon les performances
- **Intervalles optimaux** calculés automatiquement
- **Prédiction de rétention** basée sur l'historique
- **Recommandations personnalisées** d'apprentissage

## 🔧 Configuration de Développement

### Extensions VS Code Recommandées

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Variables d'Environnement

Créez un fichier `.env.local` :

```bash
# Configuration de l'application
VITE_APP_NAME="Cards"
VITE_APP_VERSION="1.0.0"

# Configuration de la base de données
VITE_DB_NAME="CardsDB"
VITE_DB_VERSION=1

# Configuration des performances
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_DURATION=3600000
```

## 🧪 Tests

### Tests Unitaires
```bash
npm run test
```

### Tests de Couverture
```bash
npm run test:coverage
```

### Tests E2E (à venir)
```bash
npm run test:e2e
```

## 🚀 Déploiement

### Build de Production
```bash
npm run build
```

### PWA (Progressive Web App)
L'application est configurée comme PWA avec :
- Cache intelligent
- Mode hors ligne
- Installation sur l'appareil
- Notifications push (à venir)

### Déploiement Cloud
Compatible avec :
- **Vercel** (recommandé)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

## 📈 Performance

### Optimisations Implémentées

- **Bundle splitting** automatique
- **Lazy loading** des composants
- **Virtual scrolling** pour les grandes listes
- **Web Workers** pour les calculs intensifs
- **Service Worker** pour le cache
- **Image optimization** avec lazy loading

### Métriques Cibles

- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1
- **Time to Interactive** : < 3.5s

### Observabilité & Logging Avancé

- Panneau diagnostics activable via `VITE_ENABLE_DIAGNOSTICS=true` (sparkline FPS, adaptations seuil)
- Logger structuré avec rate‑limit (suppression consolidée) & batching configurable (`VITE_ENABLE_LOG_BATCHING`)
- Historique des adaptations FPS (abaissement progressif du seuil pour réduire bruit)
- Budgets centralisés : `src/utils/performanceBudgets.ts` (fps, mémoire, latence)
- API clés : `logger.getSuppressionSummary()`, `logger.configureBatch()`, `logger.setBatchingEnabled()`
- Feature flags centralisés : `src/utils/featureFlags.ts`


## 🔒 Sécurité et Confidentialité

- **Données locales** : Stockage 100% local avec IndexedDB
- **Aucune collecte** de données personnelles
- **RGPD compliant** par design
- **Open source** et transparent

## 🤝 Contribution

1. **Fork** le projet
2. **Créez** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Committez** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez** une Pull Request

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 Roadmap

### Version 1.0 (Actuelle)
- ✅ Migration Flutter → React TypeScript
- ✅ 7 systèmes d'optimisation
- ✅ 4 modes d'étude
- ✅ Analytics de base

### Version 1.1 (Prochaine)
- 🔄 Import/Export Anki
- 🔄 Synchronisation cloud
- 🔄 Mode collaboratif
- 🔄 Plugins communautaires

### Version 2.0 (Future)
- 🎯 IA avancée pour recommandations
- 🎯 Reconnaissance vocale
- 🎯 Réalité augmentée
- 🎯 Gamification poussée

## 💬 Support

- **Documentation** : [Wiki du projet](https://github.com/user/cards/wiki)
- **Issues** : [GitHub Issues](https://github.com/user/cards/issues)
- **Discussions** : [GitHub Discussions](https://github.com/user/cards/discussions)
- **Discord** : [Serveur communautaire](https://discord.gg/ariba)

---

**Développé avec ❤️ par Alox92**

*Cards - Révolutionnez votre apprentissage avec l'intelligence artificielle*
