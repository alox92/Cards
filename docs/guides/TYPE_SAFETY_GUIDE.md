# 🎯 Guide de Typage TypeScript - Projet Cards

## 📊 État Actuel

Le projet contient environ **45+ occurrences de type `any`** dans les fichiers core, principalement dans :

1. **MemoryManager.ts** (8 occurrences)
2. **AlgorithmicOptimizationEngine.ts** (13 occurrences) 
3. **PerformanceOptimizer.ts** (5 occurrences)
4. **IntelligentLearningSystem.ts** (3 occurrences)
5. **SystemIntegrationMaster.ts** (1 occurrence)
6. **Workers et utilitaires** (15 occurrences)

## ⚠️ Problèmes Identifiés

### 1. Perte de Type Safety

```typescript
// ❌ PROBLÈME
private calculateSize(data: any): number {
  return JSON.stringify(data).length
}

// ✅ SOLUTION
private calculateSize<T>(data: T): number {
  return JSON.stringify(data).length
}
```

### 2. Event Handlers Non Typés

```typescript
// ❌ PROBLÈME
eventBus.subscribe('card.reviewed', (ev: any) => {
  const cardId = ev.cardId
})

// ✅ SOLUTION
interface CardReviewedEvent {
  cardId: string
  quality: number
  timestamp: number
}

eventBus.subscribe<CardReviewedEvent>('card.reviewed', (ev) => {
  const cardId = ev.cardId // Typé !
})
```

### 3. Worker Messages Sans Types

```typescript
// ❌ PROBLÈME
private handleWorkerMessage(workerId: string, message: any): void

// ✅ SOLUTION
interface WorkerMessage<T = unknown> {
  type: string
  payload: T
  requestId: string
}

private handleWorkerMessage<T>(workerId: string, message: WorkerMessage<T>): void
```

## 🔧 Solutions par Catégorie

### A. MemoryManager.ts

#### Problème 1: calculateSize avec `any`

```typescript
// Avant
private calculateSize(data: any): number {
  if (typeof data === 'string') return data.length * 2
  if (data === null || data === undefined) return 0
  return JSON.stringify(data).length
}

// Après
private calculateSize<T = unknown>(data: T): number {
  if (typeof data === 'string') return data.length * 2
  if (data === null || data === undefined) return 0
  return JSON.stringify(data).length
}
```

#### Problème 2: decompressData

```typescript
// Avant
private decompressData(compressedData: any): any {
  return JSON.parse(compressedData)
}

// Après
private decompressData<T = unknown>(compressedData: string): T {
  return JSON.parse(compressedData) as T
}
```

#### Problème 3: handleCompressionResult

```typescript
// Avant
private handleCompressionResult(_result: any): void {
  // Update cache with compressed data
}

// Après
interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  data: string
}

private handleCompressionResult(result: CompressionResult): void {
  // Maintenant typé !
}
```

### B. AlgorithmicOptimizationEngine.ts

#### Problème: Tâches avec données non typées

```typescript
// Avant
interface TaskConfig {
  type: AlgorithmType
  data: any
  priority: number
}

// Après
interface TaskConfig<T = unknown> {
  type: AlgorithmType
  data: T
  priority: number
}

// Usage avec type spécifique
interface SortTaskData {
  items: unknown[]
  compareFn?: (a: unknown, b: unknown) => number
}

const sortTask: TaskConfig<SortTaskData> = {
  type: 'sort',
  data: { items: [...], compareFn: (a, b) => a - b },
  priority: 1
}
```

#### Problème: Cache key generation

```typescript
// Avant
private generateCacheKey(type: AlgorithmType, data: any): string {
  return `${type}_${JSON.stringify(data)}`
}

// Après
private generateCacheKey<T>(type: AlgorithmType, data: T): string {
  return `${type}_${JSON.stringify(data)}`
}
```

### C. IntelligentLearningSystem.ts

#### Problème: Event payload

```typescript
// Avant
interface SettingChangedEvent {
  setting: string
  oldValue: any
  newValue: any
}

// Après
type SettingValue = string | number | boolean | string[] | Record<string, unknown>

interface SettingChangedEvent {
  setting: string
  oldValue: SettingValue
  newValue: SettingValue
}
```

### D. Event Bus Typé

```typescript
// Créer un fichier src/core/eventBus.types.ts

export interface EventPayloadMap {
  'card.reviewed': {
    cardId: string
    quality: number
    timestamp: number
    previousInterval: number
  }
  'deck.created': {
    deckId: string
    name: string
    cardCount: number
  }
  'performance.metrics': {
    fps: number
    memory: number
    loadTime: number
  }
  'setting.changed': {
    setting: string
    oldValue: SettingValue
    newValue: SettingValue
  }
}

// Modifier eventBus.ts
class EventBus {
  subscribe<K extends keyof EventPayloadMap>(
    event: K,
    handler: (payload: EventPayloadMap[K]) => void
  ): () => void {
    // Implementation
  }

  emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    // Implementation
  }
}
```

### E. Worker Pool Typé

```typescript
// Avant
export interface WorkerTask<T = any> { 
  id: string
  payload: T
  type: string
  resolve: (v: any) => void
  reject: (e: any) => void
}

// Après
export interface WorkerTask<TPayload = unknown, TResult = unknown> { 
  id: string
  payload: TPayload
  type: string
  resolve: (value: TResult) => void
  reject: (error: Error) => void
}

// Usage
interface SortPayload {
  data: number[]
  ascending: boolean
}

interface SortResult {
  sorted: number[]
  duration: number
}

const task: WorkerTask<SortPayload, SortResult> = {
  id: '123',
  payload: { data: [3,1,2], ascending: true },
  type: 'sort',
  resolve: (result) => {
    console.log(result.sorted) // Typé !
  },
  reject: (error) => {
    console.error(error.message) // Typé !
  }
}
```

### F. Fetch Plus avec Types

```typescript
// Avant
} catch(e: any) {
  lastErr = e
}

// Après
} catch(e: unknown) {
  lastErr = e instanceof Error ? e : new Error(String(e))
}
```

## 📋 Plan de Migration

### Phase 1 : Interfaces Fondamentales (Priorité Haute)
- [ ] Créer `src/core/eventBus.types.ts` avec `EventPayloadMap`
- [ ] Créer `src/core/workers/workerTypes.ts` avec types de messages
- [ ] Définir `CompressionResult` dans MemoryManager
- [ ] Définir types de tâches dans AlgorithmicOptimizationEngine

### Phase 2 : Refactoring Core (Priorité Moyenne)
- [ ] MemoryManager.ts : remplacer 8 occurrences
- [ ] AlgorithmicOptimizationEngine.ts : remplacer 13 occurrences
- [ ] PerformanceOptimizer.ts : remplacer 5 occurrences
- [ ] IntelligentLearningSystem.ts : remplacer 3 occurrences

### Phase 3 : Workers & Utils (Priorité Basse)
- [ ] WorkerPool : typer resolve/reject
- [ ] FetchPlus : remplacer `any` par `unknown`
- [ ] FetchTracker : typer fetch interceptor

## 🎨 Patterns Recommandés

### Pattern 1 : Generics au lieu de `any`

```typescript
// ❌ Éviter
function cache(key: string, value: any): void

// ✅ Préférer
function cache<T>(key: string, value: T): void
```

### Pattern 2 : `unknown` pour vraiment inconnu

```typescript
// ❌ Éviter
catch (e: any) {
  console.error(e.message)
}

// ✅ Préférer
catch (e: unknown) {
  const error = e instanceof Error ? e : new Error(String(e))
  console.error(error.message)
}
```

### Pattern 3 : Union Types pour valeurs mixtes

```typescript
// ❌ Éviter
interface Config {
  value: any
}

// ✅ Préférer
type ConfigValue = string | number | boolean | null
interface Config {
  value: ConfigValue
}
```

### Pattern 4 : Type Guards

```typescript
function isCompressionResult(value: unknown): value is CompressionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'originalSize' in value &&
    'compressedSize' in value
  )
}

// Usage
if (isCompressionResult(result)) {
  console.log(result.compressionRatio) // Sûr !
}
```

## 🔍 Outils de Vérification

### ESLint Rules

Ajouter à `.eslintrc.cjs` :

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
}
```

### TypeScript Config

Ajouter à `tsconfig.json` :

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Script de Recherche

```bash
# Compter les occurrences de 'any'
grep -r ": any" src/ --exclude-dir=__tests__ | wc -l

# Lister les fichiers avec le plus de 'any'
grep -r ": any" src/ --exclude-dir=__tests__ | cut -d: -f1 | sort | uniq -c | sort -rn

# Trouver tous les 'any' dans core/
grep -rn ": any" src/core/
```

## 🎯 Objectifs

- **Court terme** : Réduire les `any` de 45 à <20
- **Moyen terme** : Activer `noImplicitAny` dans tsconfig
- **Long terme** : 0 `any` dans le code core, strict mode activé

## 📚 Ressources

- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook - Unknown Type](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Date** : 2024
**Mainteneur** : Équipe Cards
