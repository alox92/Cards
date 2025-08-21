# 🧪 Guide du Système de Logging Avancé - Cards

## 📋 Vue d'ensemble

L'application Cards est maintenant équipée d'un système de logging avancé qui offre :

- **5 niveaux de logging** : TRACE, DEBUG, INFO, WARN, ERROR, CRITICAL
- **Logging structuré** avec catégories et contexte
- **Métriques de performance** avec timers intégrés
- **Stockage persistant** dans localStorage
- **Export des logs** en format JSON
- **Logging coloré** dans la console
- **Suivi des sessions** avec gestion de l'historique

## 🚀 Accès au Centre de Debug

### Via l'Interface Web
1. Ouvrez l'application : `http://localhost:3000`
2. Dans la navigation latérale, cliquez sur **🧪 Debug & Test**
3. Utilisez l'interface pour tester et monitorer les logs

### (Mode Desktop retiré)
L'exécution native Tauri a été supprimée. Le debug se fait exclusivement via l'interface web.

## 🛠️ Utilisation du Logger

### Import du Logger
```typescript
import { logger, logError, loggedPromise } from '@/utils/logger'
```

### Exemples d'Usage

#### Logging Basique
```typescript
// Différents niveaux
logger.trace('Category', 'Message de trace détaillé', { data: 'value' })
logger.debug('Category', 'Information de débogage', { debug: true })
logger.info('Category', 'Événement informatif', { event: 'important' })
logger.warn('Category', 'Avertissement', { warning: 'attention' })
logger.error('Category', 'Erreur détectée', { error: 'details' })
logger.critical('Category', 'Erreur critique système', { critical: true })
```

#### Gestion des Erreurs
```typescript
try {
  // Code qui peut échouer
  riskyOperation()
} catch (error) {
  logError('Module', error, { 
    phase: 'initialization',
    userId: 'user-123',
    additionalContext: 'any data'
  })
}
```

#### Métriques de Performance
```typescript
// Démarrer un timer
logger.startTimer('operation-name')

// ... code à mesurer ...

// Terminer et logger le temps
const duration = logger.endTimer('operation-name')
logger.info('Performance', `Opération terminée en ${duration}ms`)

// Ou utiliser loggedPromise pour les promesses
await loggedPromise(
  fetchData(),
  'Network',
  'Récupération des données'
)
```

#### Obtenir des Statistiques
```typescript
const perfSummary = logger.getPerformanceSummary()
logger.info('Stats', 'Résumé des performances', perfSummary)
```

## 📊 Interface de Debug

### Fonctionnalités Disponibles

1. **🚀 Lancer Tests de Logging**
   - Exécute une série complète de tests
   - Teste tous les niveaux de logging
   - Génère des métriques de performance
   - Simule des erreurs pour tester la capture

2. **🔄 Rafraîchir Logs**
   - Met à jour l'affichage des logs
   - Synchronise avec le stockage local
   - Actualise les métriques en temps réel

3. **📥 Exporter Logs**
   - Télécharge tous les logs en JSON
   - Inclut les métadonnées de session
   - Format compatible pour l'analyse

4. **🗑️ Effacer Logs**
   - Supprime tous les logs stockés
   - Remet à zéro les compteurs
   - Action irréversible

### Métriques Affichées

- **Timers Actifs** : Nombre d'opérations en cours de mesure
- **Opérations Complétées** : Total des mesures terminées
- **Durée Moyenne** : Temps moyen des opérations (ms)
- **Mémoire JS** : Usage mémoire JavaScript (MB)

### Affichage des Logs

Les logs sont affichés avec :
- **Timestamp** : Heure précise de l'événement
- **Niveau** : Couleur codée par criticité
- **Catégorie** : Module ou composant source
- **Message** : Description de l'événement
- **Contexte** : Données structurées associées

## 🔧 Configuration Avancée

### Niveaux de Log
```typescript
export enum LogLevel {
  TRACE = 0,    // Détails techniques fins
  DEBUG = 1,    // Information de débogage
  INFO = 2,     // Événements normaux
  WARN = 3,     // Avertissements
  ERROR = 4,    // Erreurs gérables
  CRITICAL = 5  // Erreurs critiques
}
```

### Catégories Recommandées
- **App** : Événements application globaux
- **Performance** : Métriques et optimisations
- **Network** : Appels réseau et API
- **Storage** : Opérations de stockage
- **UI** : Interactions utilisateur
- **Data** : Manipulation des données
- **Auth** : Authentification et sécurité

## 🎯 Cas d'Usage Pratiques

### Débogage de Performance
```typescript
// Identifier les goulots d'étranglement
logger.startTimer('render-cards')
await renderCards()
const renderTime = logger.endTimer('render-cards')

if (renderTime > 16) { // > 60fps
  logger.warn('Performance', 'Rendu lent détecté', { 
    duration: renderTime,
    target: '16ms for 60fps'
  })
}
```

### Suivi des Erreurs Utilisateur
```typescript
// Capturer les erreurs avec contexte utilisateur
function handleCardStudy(cardId: string) {
  try {
    studyCard(cardId)
    logger.info('Study', 'Carte étudiée avec succès', { cardId })
  } catch (error) {
    logError('Study', error, {
      cardId,
      userAction: 'study',
      timestamp: Date.now()
    })
  }
}
```

### Analyse de Session
```typescript
// Démarrer une session de logging
logger.info('Session', '🎯 Nouvelle session d\'étude démarrée', {
  sessionId: generateSessionId(),
  userLevel: getUserLevel(),
  deckCount: getDeckCount()
})
```

## 📈 Monitoring et Alertes

### Seuils de Performance
- **Initialisation** : < 2000ms optimal
- **Rendu** : < 16ms pour 60fps
- **Navigation** : < 300ms pour UX fluide
- **Stockage** : < 100ms pour opérations locales

### Indicateurs de Santé
- **Mémoire** : < 100MB usage normal
- **Erreurs** : < 1% taux d'erreur acceptable
- **Performance** : 95% opérations sous seuils

## 🔍 Dépannage

### Logs Manquants
1. Vérifier la console (F12)
2. Contrôler localStorage : `cards-logs`
3. Redémarrer l'application si nécessaire

### Performance Dégradée
1. Consulter les métriques de performance
2. Identifier les opérations lentes
3. Exporter les logs pour analyse

### Erreurs Critiques
1. Les erreurs critiques sont automatiquement capturées
2. Stack traces complètes disponibles
3. Contexte détaillé pour reproduction

## 🎉 Conclusion

Le système de logging avancé transforme Cards en une application facilement débogable avec :

- **Visibilité complète** des opérations internes
- **Métriques de performance** pour optimisation 120fps
- **Capture d'erreurs** intelligente avec contexte
- **Interface de debug** intuitive et puissante
- **Export de données** pour analyse approfondie

**Prêt pour un développement efficace et un débogage de qualité professionnelle !** 🚀

---

*Guide généré pour Cards v1.0.0 - Système de Logging Avancé*
