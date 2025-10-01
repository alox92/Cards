# System Patterns - Cards (Ariba)

## Architectural Patterns

### **1. Clean Architecture (Onion Architecture)**
**Usage**: Structure globale projet

```
UI → Application → Domain ← Infrastructure ← Data
     (dependencies flow inward)
```

**Exemple**:
```typescript
// Domain (pur, pas de dépendances)
export interface Card {
  id: string;
  frontText: string;
  backText: string;
}

// Infrastructure (interface abstraction)
export interface CardRepository {
  getById(id: string): Promise<Card | null>;
  save(card: Card): Promise<void>;
}

// Data (implémentation concrète)
export class IndexedDBCardRepository implements CardRepository {
  async getById(id: string) {
    return await db.cards.get(id);
  }
}

// Application (use case)
export class GetCardUseCase {
  constructor(private repo: CardRepository) {}
  async execute(id: string) {
    return await this.repo.getById(id);
  }
}

// UI (consomme via DI)
const card = await container.resolve<CardRepository>('CardRepository').getById(id);
```

---

### **2. Repository Pattern**
**Usage**: Abstraction accès données (IndexedDB)

**Fichiers**: `src/data/repositories/*.ts`

```typescript
// Interface (domain layer)
export interface DeckRepository {
  getAll(): Promise<Deck[]>;
  getById(id: string): Promise<Deck | null>;
  create(deck: Deck): Promise<string>;
  update(deck: Deck): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implémentation IndexedDB
export class DexieDeckRepository implements DeckRepository {
  private db: Database;
  
  async getAll(): Promise<Deck[]> {
    return await this.db.decks.toArray();
  }
  
  async getById(id: string): Promise<Deck | null> {
    return await this.db.decks.get(id) ?? null;
  }
}
```

**Avantages**:
- Swap IndexedDB → Firebase sans changer business logic
- Tests unitaires avec mock repository
- Cache layer transparent

---

### **3. Dependency Injection (Service Locator)**
**Usage**: Résolution dépendances, testabilité

**Fichier**: `src/infrastructure/ServiceProvider.tsx`

```typescript
// Container registration
container.registerSingleton<CardRepository>(
  'CardRepository',
  () => new IndexedDBCardRepository(db)
);

// Resolution (UI/Application)
const repo = container.resolve<CardRepository>('CardRepository');

// React hook wrapper
export function useCardService() {
  return container.resolve<CardRepository>('CardRepository');
}
```

**Pattern singleton threadsafe**:
```typescript
export class ServiceProvider {
  private static instance: ServiceProvider | null = null;
  
  static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }
}
```

---

### **4. Singleton Pattern (Systems)**
**Usage**: 7 systèmes d'optimisation

**Exemple**: `src/core/IntelligentLearningSystem.ts`

```typescript
export class IntelligentLearningSystem {
  private static instance: IntelligentLearningSystem | null = null;
  
  private constructor() {
    // Initialisation différée
  }
  
  static getInstance(): IntelligentLearningSystem {
    if (!IntelligentLearningSystem.instance) {
      IntelligentLearningSystem.instance = new IntelligentLearningSystem();
    }
    return IntelligentLearningSystem.instance;
  }
  
  // Cleanup for tests
  static resetInstance(): void {
    IntelligentLearningSystem.instance = null;
  }
}
```

**Utilisation globale**:
```typescript
// Dans composants
const ils = IntelligentLearningSystem.getInstance();
const recommendations = ils.generateRecommendations(profile);
```

---

### **5. Strategy Pattern (Algorithms)**
**Usage**: Algorithmes d'apprentissage interchangeables

**Fichier**: `src/utils/learningAlgorithms.ts`

```typescript
export interface LearningAlgorithm {
  calculateNextReview(card: Card): Date;
  updateDifficulty(card: Card, quality: number): number;
}

export class SM2Algorithm implements LearningAlgorithm {
  calculateNextReview(card: Card): Date {
    // Spaced Repetition SuperMemo 2
  }
}

export class LeitnerAlgorithm implements LearningAlgorithm {
  calculateNextReview(card: Card): Date {
    // Leitner Box System
  }
}

// Usage
const algorithm: LearningAlgorithm = new SM2Algorithm();
const nextReview = algorithm.calculateNextReview(card);
```

---

### **6. Observer Pattern (Event Bus)**
**Usage**: Communication inter-systèmes

**Fichier**: `src/core/SystemIntegrationMaster.ts`

```typescript
type EventCallback = (data: unknown) => void;

export class EventBus {
  private listeners = new Map<string, EventCallback[]>();
  
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }
  
  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// Usage
const bus = new EventBus();
bus.subscribe('card:reviewed', (data) => {
  console.log('Card reviewed:', data);
});
bus.emit('card:reviewed', { cardId: '123', score: 4 });
```

---

### **7. Factory Pattern (Workers)**
**Usage**: Création Web Workers pool

**Fichier**: `src/core/AlgorithmicOptimizationEngine.ts`

```typescript
export class WorkerPool {
  private workers: Worker[] = [];
  
  createWorker(): Worker {
    const worker = new Worker(
      new URL('../workers/algorithm.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.workers.push(worker);
    return worker;
  }
  
  getOptimalWorkerCount(): number {
    return Math.min(navigator.hardwareConcurrency || 2, 4);
  }
  
  initializePool(): void {
    const count = this.getOptimalWorkerCount();
    for (let i = 0; i < count; i++) {
      this.createWorker();
    }
  }
}
```

---

## Design Patterns

### **1. Hook Pattern (React)**
**Usage**: Logique réutilisable composants

**Exemple**: `src/ui/hooks/useDeck.ts`

```typescript
export function useDeck(deckId: string) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadDeck = async () => {
      try {
        const repo = container.resolve<DeckRepository>('DeckRepository');
        const result = await repo.getById(deckId);
        setDeck(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    };
    loadDeck();
  }, [deckId]);
  
  return { deck, loading, error };
}

// Usage
function DeckViewer({ deckId }: { deckId: string }) {
  const { deck, loading, error } = useDeck(deckId);
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <DeckDisplay deck={deck!} />;
}
```

---

### **2. Render Props / Children as Function**
**Usage**: Composants flexibles avec injection

**Exemple**: `src/ui/components/CardList.tsx`

```typescript
interface CardListProps {
  cards: Card[];
  renderCard: (card: Card) => React.ReactNode;
}

export function CardList({ cards, renderCard }: CardListProps) {
  return (
    <div className="card-list">
      {cards.map(card => (
        <div key={card.id}>{renderCard(card)}</div>
      ))}
    </div>
  );
}

// Usage
<CardList
  cards={myCards}
  renderCard={(card) => <CardThumbnail card={card} />}
/>
```

---

### **3. Compound Components**
**Usage**: Composants liés avec context partagé

**Exemple**: `src/ui/components/Tabs.tsx`

```typescript
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
} | null>(null);

export function Tabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('');
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const ctx = useContext(TabsContext)!;
  return (
    <button
      className={ctx.activeTab === id ? 'active' : ''}
      onClick={() => ctx.setActiveTab(id)}
    >
      {children}
    </button>
  );
};

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab id="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab id="tab2">Tab 2</Tabs.Tab>
  </Tabs.List>
</Tabs>
```

---

### **4. Adapter Pattern (APIs non-standard)**
**Usage**: Wrapper APIs navigateur non-typées

**Exemple**: `src/utils/performanceAdapter.ts`

```typescript
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export class PerformanceAdapter {
  getMemoryInfo(): MemoryInfo | null {
    const perf = performance as unknown as {
      memory?: MemoryInfo;
    };
    return perf.memory ?? null;
  }
  
  requestIdleCallback(
    callback: () => void,
    options?: { timeout: number }
  ): number {
    const win = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: unknown) => number;
    };
    
    if (win.requestIdleCallback) {
      return win.requestIdleCallback(callback, options);
    }
    
    // Fallback
    return window.setTimeout(callback, 1) as unknown as number;
  }
}
```

---

### **5. Decorator Pattern (HOC React)**
**Usage**: Ajout fonctionnalités composants

**Exemple**: `src/ui/hoc/withErrorBoundary.tsx`

```typescript
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Usage
const SafeStudyPage = withErrorBoundary(StudyPage);
```

---

### **6. Facade Pattern (Service Aggregation)**
**Usage**: Simplifier interactions complexes

**Exemple**: `src/application/DeckService.ts`

```typescript
export class DeckService {
  constructor(
    private deckRepo: DeckRepository,
    private cardRepo: CardRepository,
    private statsService: StatsService
  ) {}
  
  async createDeckWithCards(
    deckData: Partial<Deck>,
    cardData: Partial<Card>[]
  ): Promise<string> {
    // Facade aggregates multiple operations
    const deckId = await this.deckRepo.create(deckData as Deck);
    
    for (const card of cardData) {
      await this.cardRepo.create({ ...card, deckId } as Card);
    }
    
    await this.statsService.initializeDeckStats(deckId);
    
    return deckId;
  }
}
```

---

## Common Idioms

### **1. Type Guards**
**Usage**: Type narrowing `unknown` → type spécifique

```typescript
function isCard(value: unknown): value is Card {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'frontText' in value &&
    typeof (value as Card).frontText === 'string'
  );
}

// Usage
function processData(data: unknown) {
  if (isCard(data)) {
    // TypeScript knows data is Card here
    console.log(data.frontText);
  }
}
```

---

### **2. Discriminated Unions**
**Usage**: Type-safe state machines

```typescript
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Deck[] }
  | { status: 'error'; error: Error };

function handleState(state: LoadingState) {
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <DeckList decks={state.data} />;
    case 'error':
      return <Error message={state.error.message} />;
  }
}
```

---

### **3. Optional Chaining + Nullish Coalescing**
**Usage**: Safe property access

```typescript
// Optional chaining
const memory = (performance as unknown as { memory?: MemoryInfo }).memory?.usedJSHeapSize;

// Nullish coalescing
const fps = fpsMonitor.getCurrentFPS() ?? 60;

// Combined
const heapSize = performance.memory?.usedJSHeapSize ?? 0;
```

---

### **4. Async/Await Error Handling**
**Usage**: Pattern standard erreurs async

```typescript
async function loadDeck(id: string): Promise<Deck | null> {
  try {
    const repo = container.resolve<DeckRepository>('DeckRepository');
    const deck = await repo.getById(id);
    
    if (!deck) {
      logger.warn('Deck not found', { id });
      return null;
    }
    
    return deck;
  } catch (error) {
    logger.error('Failed to load deck', {
      id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
```

---

### **5. Memoization (React)**
**Usage**: Optimisation re-renders

```typescript
const MemoizedCard = memo(function Card({ card }: { card: Card }) {
  return <div>{card.frontText}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.card.id === nextProps.card.id;
});

// useMemo for expensive calculations
function StudyStats({ cards }: { cards: Card[] }) {
  const avgDifficulty = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length;
  }, [cards]);
  
  return <div>Avg Difficulty: {avgDifficulty}</div>;
}

// useCallback for stable references
function DeckEditor({ onSave }: { onSave: (deck: Deck) => void }) {
  const handleSave = useCallback((deck: Deck) => {
    logger.info('Saving deck', { deckId: deck.id });
    onSave(deck);
  }, [onSave]);
  
  return <button onClick={() => handleSave(deck)}>Save</button>;
}
```

---

### **6. Error Boundaries (React)**
**Usage**: Catch erreurs rendering

```typescript
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      componentStack: info.componentStack
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} />;
    }
    return this.props.children;
  }
}
```

---

### **7. Lazy Loading + Code Splitting**
**Usage**: Optimisation bundle size

```typescript
// Route-based splitting
const StudyPage = lazy(() => import('./ui/pages/StudyPage'));
const SettingsPage = lazy(() => import('./ui/pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/study" element={<StudyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}

// Component-based splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading chart...</div>}>
        <HeavyChart data={chartData} />
      </Suspense>
    </div>
  );
}
```

---

### **8. Custom Events (Inter-component Communication)**
**Usage**: Communication sans prop drilling

```typescript
// Event definition
export const CARD_REVIEWED_EVENT = 'card:reviewed';

export interface CardReviewedDetail {
  cardId: string;
  quality: number;
  timestamp: number;
}

// Dispatch
function dispatchCardReviewed(detail: CardReviewedDetail) {
  const event = new CustomEvent(CARD_REVIEWED_EVENT, { detail });
  window.dispatchEvent(event);
}

// Listen
useEffect(() => {
  const handleCardReviewed = (e: Event) => {
    const detail = (e as CustomEvent<CardReviewedDetail>).detail;
    logger.info('Card reviewed', detail);
  };
  
  window.addEventListener(CARD_REVIEWED_EVENT, handleCardReviewed);
  return () => window.removeEventListener(CARD_REVIEWED_EVENT, handleCardReviewed);
}, []);
```

---

### **9. Debounce/Throttle**
**Usage**: Optimisation événements fréquents

```typescript
// Debounce (dernier appel après délai)
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Throttle (premier appel puis intervalle)
function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

// Usage
const debouncedSearch = debounce((query: string) => {
  searchCards(query);
}, 300);

const throttledScroll = throttle(() => {
  updateScrollPosition();
}, 100);
```

---

### **10. Builder Pattern (Complex Object Creation)**
**Usage**: Construction objets complexes fluent API

```typescript
export class DeckBuilder {
  private deck: Partial<Deck> = {};
  
  setName(name: string): this {
    this.deck.name = name;
    return this;
  }
  
  setDescription(description: string): this {
    this.deck.description = description;
    return this;
  }
  
  addTag(tag: string): this {
    this.deck.tags = [...(this.deck.tags || []), tag];
    return this;
  }
  
  build(): Deck {
    if (!this.deck.name) throw new Error('Deck name required');
    return {
      id: generateId(),
      name: this.deck.name,
      description: this.deck.description || '',
      tags: this.deck.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as Deck;
  }
}

// Usage
const deck = new DeckBuilder()
  .setName('JavaScript Basics')
  .setDescription('Fundamentals of JS')
  .addTag('programming')
  .addTag('javascript')
  .build();
```

---

**Last Updated**: 2025-01-01  
**Document Owner**: Development Team