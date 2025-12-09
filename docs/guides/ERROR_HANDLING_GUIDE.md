# 🚨 Guide de Gestion des Erreurs - Projet Cards

## 📚 Système d'Erreurs Unifié

Le projet utilise un système d'erreurs typées basé sur `AppError` (voir `src/utils/errors.ts`).

### Classes d'Erreurs Disponibles

```typescript
import { 
  AppError,         // Erreur générique de l'application
  DataError,        // Erreurs liées aux données (DB, cache)
  NotFoundError,    // Ressource introuvable
  ValidationError,  // Validation de données échouée
  PerformanceError, // Problèmes de performance
  ServiceError,     // Erreurs de services externes
  normalizeError    // Fonction de normalisation
} from '@/utils/errors'
```

### Structure des Erreurs

```typescript
class AppError extends Error {
  constructor(
    message: string,      // Message descriptif
    public code?: string, // Code d'erreur optionnel (ex: 'DECK_NOT_FOUND')
    public meta?: Record<string, any> // Métadonnées contextuelles
  )
}
```

## ✅ Bonnes Pratiques

### 1. Lancer des Erreurs Typées

**❌ À ÉVITER :**
```typescript
throw new Error('Card not found')
throw 'Something went wrong'
return { success: false, error: 'Invalid data' }
```

**✅ RECOMMANDÉ :**
```typescript
throw new NotFoundError('Card not found', 'CARD_NOT_FOUND', { cardId })
throw new ValidationError('Invalid email format', 'INVALID_EMAIL', { email })
throw new DataError('Failed to save deck', 'DECK_SAVE_FAILED', { deckId, reason })
```

### 2. Capturer et Normaliser les Erreurs

**❌ À ÉVITER :**
```typescript
try {
  await saveCard(card)
} catch (err) {
  console.error('Save failed', err)
  return null
}
```

**✅ RECOMMANDÉ :**
```typescript
import { normalizeError } from '@/utils/errors'

try {
  await saveCard(card)
} catch (err) {
  const error = normalizeError(err)
  logger.error('CardSave', error.message, error.meta)
  throw new DataError('Failed to save card', 'CARD_SAVE_FAILED', { 
    cardId: card.id, 
    originalError: error 
  })
}
```

### 3. Utiliser le Logger au lieu de console.error

**❌ À ÉVITER :**
```typescript
catch (err) {
  console.error('Compression image échouée', err)
}
```

**✅ RECOMMANDÉ :**
```typescript
import { logger } from '@/utils/logger'

catch (err) {
  const error = normalizeError(err)
  logger.error('ImageCompression', error.message, { 
    imageSize: file.size,
    error: error.meta 
  })
}
```

### 4. Gestion d'Erreurs dans les Services

```typescript
export class DeckService {
  async getDeck(id: string): Promise<Deck> {
    try {
      const deck = await this.repository.findById(id)
      if (!deck) {
        throw new NotFoundError('Deck not found', 'DECK_NOT_FOUND', { id })
      }
      return deck
    } catch (err) {
      if (err instanceof NotFoundError) throw err
      
      const normalized = normalizeError(err)
      throw new DataError(
        'Failed to retrieve deck', 
        'DECK_RETRIEVAL_FAILED', 
        { id, originalError: normalized }
      )
    }
  }
}
```

### 5. Gestion d'Erreurs dans les Composants React

```typescript
import { normalizeError } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { useFeedback } from '@/ui/components/feedback/useFeedback'

function CardEditor() {
  const { showError } = useFeedback()
  
  const handleSave = async () => {
    try {
      await saveCard(card)
    } catch (err) {
      const error = normalizeError(err)
      logger.error('CardEditor', 'Save failed', { cardId: card.id, error })
      showError(error.message)
    }
  }
}
```

## 📋 Codes d'Erreur Standardisés

### Nomenclature

Format : `ENTITY_ACTION_REASON`

Exemples :
- `DECK_NOT_FOUND` - Deck introuvable
- `CARD_SAVE_FAILED` - Échec sauvegarde carte
- `DECK_VALIDATION_FAILED` - Validation deck échouée
- `EXPORT_COMPRESSION_FAILED` - Échec compression export

### Catégories par Préfixe

- **DECK_*** : Opérations sur les decks
- **CARD_*** : Opérations sur les cartes
- **STUDY_*** : Opérations d'étude
- **EXPORT_*** : Opérations d'export
- **IMPORT_*** : Opérations d'import
- **PERF_*** : Problèmes de performance
- **DB_*** : Erreurs base de données

## 🔄 Migration du Code Existant

### Fichiers à Corriger (Priorité Haute)

1. **src/ui/pages/CardEditorPage.tsx** (lignes 187, 201)
   - Remplacer `console.error` par logger
   - Utiliser `DataError` pour échecs de compression

2. **src/ui/components/Editor/UltraRichTextEditor.tsx** (ligne 821)
   - Remplacer `console.error` par logger
   - Utiliser `DataError` pour échecs de drop d'image

3. **src/domain/usecases/review/recordReview.ts** (ligne 14)
   - Remplacer `throw new Error` par `throw new NotFoundError`

4. **src/core/AlgorithmicOptimizationEngine.ts** (ligne 446)
   - Remplacer `throw new Error` par `throw new ValidationError`

5. **src/utils/performanceBudgets.ts** (lignes 24-25)
   - Remplacer `throw new Error` par `throw new ValidationError`

### Script de Recherche des Occurrences

```bash
# Trouver tous les console.error dans src/
grep -r "console.error" src/ --exclude-dir=__tests__

# Trouver tous les throw new Error dans src/
grep -r "throw new Error" src/ --exclude-dir=__tests__
```

## 🎯 Checklist de Révision

Lors de la révision de code, vérifier :

- [ ] Aucun `throw new Error()` générique
- [ ] Aucun `console.error()` (utiliser `logger.error()`)
- [ ] Toutes les erreurs capturées sont normalisées avec `normalizeError()`
- [ ] Les codes d'erreur suivent la nomenclature `ENTITY_ACTION_REASON`
- [ ] Les métadonnées d'erreur contiennent suffisamment de contexte
- [ ] Les erreurs UI sont affichées via `useFeedback` ou ErrorBoundary
- [ ] Les erreurs critiques sont loggées avec `logger.error()`

## 📊 Patterns Avancés

### ErrorBoundary avec Tracking

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const normalized = normalizeError(error)
    logger.error('React', 'Component error', {
      error: normalized,
      componentStack: errorInfo.componentStack
    })
  }
}
```

### Retry avec Gestion d'Erreurs

```typescript
async function withRetry<T>(
  fn: () => Promise<T>, 
  maxAttempts = 3
): Promise<T> {
  let lastError: AppError
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = normalizeError(err)
      logger.warn('Retry', `Attempt ${attempt} failed`, { 
        error: lastError, 
        remaining: maxAttempts - attempt 
      })
    }
  }
  
  throw new ServiceError(
    'Max retry attempts reached',
    'MAX_RETRY_EXCEEDED',
    { maxAttempts, lastError }
  )
}
```

## 🔗 Ressources

- **Fichier principal** : `src/utils/errors.ts`
- **Logger** : `src/utils/logger.ts`
- **Tests** : `src/__tests__/errors.test.ts` (à créer)
- **Monitoring** : Intégration future avec Sentry/DataDog

---

**Date de mise à jour** : 2024
**Mainteneur** : Équipe Cards
