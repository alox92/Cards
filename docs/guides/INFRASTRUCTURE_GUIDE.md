# 🏗️ Infrastructure et Architecture Améliorées

## 📋 Vue d'ensemble

Ce document décrit les améliorations architecturales apportées au projet Cards pour renforcer la structure, la maintenabilité et la testabilité du code.

## 🎯 Objectifs des améliorations

1. **Séparation claire des responsabilités** : Core (systèmes) vs Application (services métier)
2. **Dependency Injection complète** : Tous les services enregistrés dans Container
3. **Abstraction via interfaces** : Faciliter les tests et le remplacement d'implémentations
4. **Gestion d'erreur robuste** : BaseService avec retry logic et logging automatique
5. **Métriques et monitoring** : Suivi des performances de chaque service
6. **Type safety** : Élimination des `any`, types stricts partout

## 🏛️ Architecture en couches

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React)                        │
│  - Components, Pages, Hooks                                  │
│  - Utilise services via hooks (useOCRService, etc.)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Application Layer (Services)                    │
│  - Services métier (OCR, Chat, Leaderboard, etc.)          │
│  - Use cases et logique applicative                         │
│  - Orchestration des domaines                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Domain Layer (Entities)                      │
│  - Entités métier (Card, Deck, User, etc.)                 │
│  - Interfaces des repositories                               │
│  - Logique métier pure (sans dépendances)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Infrastructure Layer (Persistence)                │
│  - Implémentations des repositories                          │
│  - IndexedDB (Dexie), LocalStorage                          │
│  - APIs externes (si nécessaire)                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Core Layer (Systems)                      │
│  - 7 systèmes d'optimisation fondamentaux                   │
│  - IntelligentLearningSystem, PerformanceOptimizer, etc.   │
│  - Pas de logique métier, uniquement infrastructure        │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Structure des dossiers

```
src/
├── application/
│   ├── Container.ts                    # 🎯 DI Container
│   └── services/
│       ├── base/
│       │   └── BaseService.ts         # 📦 Classe de base pour services
│       ├── ocr/
│       │   ├── IOCRService.ts         # 📄 Interface OCR
│       │   ├── TesseractOCRService.ts # ✅ Implémentation Tesseract
│       │   └── index.ts               # 📤 Exports
│       ├── chat/
│       │   ├── IChatService.ts        # 📄 Interface Chat
│       │   ├── ChatService.ts         # ✅ Implémentation
│       │   └── index.ts
│       ├── leaderboard/
│       │   ├── ILeaderboardService.ts # 📄 Interface Leaderboard
│       │   ├── LeaderboardService.ts  # ✅ Implémentation
│       │   └── index.ts
│       ├── CardService.ts
│       ├── DeckService.ts
│       └── ...
│
├── core/                               # 🎯 Systèmes d'optimisation
│   ├── IntelligentLearningSystem.ts
│   ├── PerformanceOptimizer.ts
│   ├── MemoryManager.ts
│   └── ... (7 systèmes uniquement)
│
├── domain/                             # 🏛️ Logique métier
│   ├── entities/
│   │   ├── Card.ts
│   │   └── Deck.ts
│   └── repositories/
│       ├── CardRepository.ts          # Interface
│       └── DeckRepository.ts          # Interface
│
├── infrastructure/                     # 💾 Implémentations
│   └── persistence/
│       ├── dexie/
│       │   ├── DexieCardRepository.ts
│       │   └── DexieDeckRepository.ts
│       └── LocalCardRepository.ts
│
└── ui/                                 # 🎨 Interface utilisateur
    ├── components/
    ├── hooks/
    │   ├── useOCRService.ts           # 🪝 Hook OCR
    │   ├── useChatService.ts          # 🪝 Hook Chat
    │   └── ...
    └── pages/
```

## 🔧 BaseService : Classe de base pour services

Tous les services applicatifs héritent de `BaseService` pour bénéficier de :

### ✨ Fonctionnalités automatiques

1. **Logging automatique** : Chaque opération loggée avec contexte
2. **Retry logic** : Tentatives automatiques avec backoff exponentiel
3. **Timeout protection** : Protection contre les opérations longues
4. **Métriques** : Suivi automatique des performances
5. **Error wrapping** : Erreurs enrichies avec contexte

### 📊 Exemple d'utilisation

```typescript
export class MyService extends BaseService implements IMyService {
  constructor() {
    super({
      name: 'MyService',
      retryAttempts: 3,      // Nombre de tentatives
      retryDelay: 1000,      // Délai entre tentatives (ms)
      timeout: 30000         // Timeout maximum (ms)
    })
  }

  async myOperation(): Promise<Result> {
    return this.executeWithRetry(
      async () => {
        // Logique métier ici
        this.log('Opération en cours')
        const result = await someAsyncOperation()
        return result
      },
      'myOperation',
      {
        shouldRetry: (error) => error.message.includes('temporary')
      }
    )
  }

  async dispose(): Promise<void> {
    // Cleanup des ressources
    this.log('Nettoyage des ressources')
  }
}
```

### 📈 Métriques disponibles

```typescript
const metrics = service.getMetrics()
// {
//   totalCalls: 150,
//   successfulCalls: 148,
//   failedCalls: 2,
//   averageResponseTime: 234.5,
//   lastError: Error | null
// }
```

## 🎯 Pattern Dependency Injection

### Enregistrement dans Container

```typescript
// application/Container.ts
container.register(OCR_SERVICE_TOKEN, () => new TesseractOCRService())
container.register(CHAT_SERVICE_TOKEN, () => new ChatService())
```

### Résolution dans les hooks

```typescript
// ui/hooks/useOCRService.ts
export function useOCRService() {
  const [service] = useState<IOCRService>(() => 
    container.resolve<IOCRService>(OCR_SERVICE_TOKEN)
  )
  
  return { service, isReady: service.isReady() }
}
```

### Utilisation dans composants

```typescript
function MyComponent() {
  const { service, isReady } = useOCRService()
  
  const handleRecognize = async (image: File) => {
    if (!isReady) return
    
    const result = await service.recognizeFromFile(image, {
      language: 'fra',
      onProgress: (progress) => console.log(progress)
    })
    
    console.log('Texte reconnu:', result.text)
  }
  
  return <div>...</div>
}
```

## 🧪 Testabilité améliorée

### Mock d'un service

```typescript
// __tests__/MyComponent.test.tsx
import { vi } from 'vitest'
import { container } from '@/application/Container'
import { OCR_SERVICE_TOKEN } from '@/application/services/ocr'

const mockOCRService: IOCRService = {
  recognizeText: vi.fn().mockResolvedValue({
    text: 'Mock text',
    confidence: 95,
    blocks: [],
    language: 'eng',
    processingTime: 100
  }),
  isReady: vi.fn().mockReturnValue(true),
  // ... autres méthodes mockées
}

beforeEach(() => {
  container.register(OCR_SERVICE_TOKEN, () => mockOCRService)
})

test('should recognize text', async () => {
  const { service } = useOCRService()
  const result = await service.recognizeText(mockImage)
  
  expect(result.text).toBe('Mock text')
  expect(mockOCRService.recognizeText).toHaveBeenCalledWith(mockImage)
})
```

## 🔄 Migration depuis l'ancien code

### Avant (Singleton direct)

```typescript
// ❌ Ancien code
import OCRService from '@/core/OCRService'

const result = await OCRService.recognizeText(image)
```

### Après (DI + Interface)

```typescript
// ✅ Nouveau code
import { useOCRService } from '@/ui/hooks/useOCRService'

function MyComponent() {
  const { service, isReady } = useOCRService()
  
  const handleRecognize = async () => {
    if (!isReady) return
    const result = await service.recognizeText(image)
  }
}
```

## 📝 Conventions de nommage

### Services

- **Interface** : `I{ServiceName}Service` (ex: `IOCRService`)
- **Implémentation** : `{Technology}{ServiceName}Service` (ex: `TesseractOCRService`)
- **Token DI** : `{SERVICE_NAME}_SERVICE_TOKEN` (ex: `OCR_SERVICE_TOKEN`)

### Hooks

- **Hook** : `use{ServiceName}Service` (ex: `useOCRService`)

### Fichiers

- **Interface** : `I{ServiceName}Service.ts`
- **Implémentation** : `{Technology}{ServiceName}Service.ts`
- **Index** : `index.ts` (exports centralisés)

## 🚀 Avantages de cette architecture

### ✅ Pour le développement

1. **Séparation claire** : Chaque couche a sa responsabilité
2. **Type safety** : Types stricts, auto-complétion IDE
3. **DRY** : BaseService élimine code dupliqué
4. **Debugging** : Logs automatiques, métriques détaillées

### ✅ Pour les tests

1. **Mocking facile** : Interfaces permettent mocks simples
2. **Isolation** : Services testables indépendamment
3. **Coverage** : Chaque service peut être couvert à 100%

### ✅ Pour la maintenance

1. **Évolutivité** : Facile d'ajouter nouveaux services
2. **Refactoring** : Changements localisés, pas d'impact global
3. **Documentation** : Interfaces servent de contrat
4. **Monitoring** : Métriques intégrées pour chaque service

## 🎓 Best Practices

### 1. Toujours utiliser les interfaces

```typescript
// ✅ Bon
function processOCR(service: IOCRService) { ... }

// ❌ Mauvais
function processOCR(service: TesseractOCRService) { ... }
```

### 2. Hériter de BaseService

```typescript
// ✅ Bon
export class MyService extends BaseService implements IMyService {
  constructor() {
    super({ name: 'MyService' })
  }
}

// ❌ Mauvais (pas de logging, retry, métriques)
export class MyService implements IMyService {
  async doSomething() { ... }
}
```

### 3. Utiliser executeWithRetry pour opérations async

```typescript
// ✅ Bon
async fetchData(): Promise<Data> {
  return this.executeWithRetry(
    async () => {
      return await api.getData()
    },
    'fetchData'
  )
}

// ❌ Mauvais (pas de retry, pas de métriques)
async fetchData(): Promise<Data> {
  return await api.getData()
}
```

### 4. Toujours disposer les ressources

```typescript
// ✅ Bon
useEffect(() => {
  return () => {
    void service.dispose()
  }
}, [service])

// ❌ Mauvais (memory leak)
useEffect(() => {
  // Service reste en mémoire
}, [service])
```

## 📚 Documentation complète

- [BaseService API](./base/BaseService.ts)
- [OCR Service](./ocr/IOCRService.ts)
- [Container DI](../Container.ts)
- [Testing Guide](../../../TESTING_GUIDE.md)

---

**Dernière mise à jour** : 12 octobre 2025  
**Auteur** : Équipe Dev Cards  
**Version** : 2.0.0
