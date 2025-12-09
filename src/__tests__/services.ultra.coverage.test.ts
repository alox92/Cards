import { describe, it, expect, vi, beforeAll } from "vitest";

// Silencer logger / event bus
vi.mock("@/utils/logger", () => ({
  logger: { error: vi.fn(), debug: vi.fn(), info: vi.fn() },
}));
vi.mock("@/core/events/EventBus", () => ({ eventBus: { publish: vi.fn() } }));

// --- In‑memory aribaDB minimal stub (reused / idempotent) ---
const makeTable = () => {
  const api: any = {
    _rows: [] as any[],
    bulkAdd(arr: any[]) {
      api._rows.push(...arr);
      return Promise.resolve();
    },
    add(row: any) {
      api._rows.push(row);
      return Promise.resolve();
    },
    put(row: any) {
      const i = api._rows.findIndex((r: any) =>
        r.term ? r.term === row.term : false
      );
      if (i >= 0) api._rows[i] = row;
      else api._rows.push(row);
      return Promise.resolve();
    },
    clear() {
      api._rows = [];
      return Promise.resolve();
    },
    where(field: string) {
      return {
        equals: (val: any) => ({
          toArray: async () => api._rows.filter((r: any) => r[field] === val),
          first: async () =>
            api._rows.find((r: any) => r[field] === val) || null,
          delete: async () => {
            api._rows = api._rows.filter((r: any) => r[field] !== val);
          },
        }),
      };
    },
    count: async () => Promise.resolve(api._rows.length),
  };
  return api;
};
const ensureAriba = () => {
  const g: any = globalThis as any;
  const existing = g.aribaDB || {};
  const tables = existing._tables || existing.tables || {};
  tables.searchIndex = tables.searchIndex || makeTable();
  tables.searchTrigrams = tables.searchTrigrams || makeTable();
  tables.searchTermStats = tables.searchTermStats || makeTable();
  tables.cards = tables.cards || { count: async () => tables._cardCount || 0 };
  g.aribaDB = {
    ...existing,
    ...tables,
    _tables: tables,
    table: (name: string) => (tables[name] ||= makeTable()),
  };
};
ensureAriba();
vi.mock("@/infrastructure/persistence/dexie/AribaDB", () => ({
  aribaDB: (globalThis as any).aribaDB,
}));

// --- Fake global navigator concurrency for parallel branches ---
beforeAll(() => {
  (globalThis as any).navigator = { hardwareConcurrency: 4 };
});

// --- Worker mocks success paths ---
// Simple helper to create a pseudo worker with addEventListener API
class BaseMockWorker {
  private listeners: Record<string, Function[]> = { message: [], error: [] };
  onmessage: ((ev: MessageEvent<any>) => void) | null = null; // for fuzzy worker direct style
  addEventListener(type: string, cb: any) {
    (this.listeners[type] ||= []).push(cb);
  }
  removeEventListener(type: string, cb: any) {
    this.listeners[type] = (this.listeners[type] || []).filter((l) => l !== cb);
  }
  terminate() {}
  protected emit(type: "message" | "error", data: any) {
    if (type === "message" && this.onmessage) {
      this.onmessage({ data } as any);
    }
    for (const l of this.listeners[type] || []) {
      l({ data });
    }
  }
}

// heatmapStatsWorker success aggregation
vi.mock("@/workers/heatmapStatsWorker?worker", () => ({
  default: class HeatmapWorker extends BaseMockWorker {
    postMessage(payload: any) {
      // Build map of day->sum(cardsStudied)
      const map: Record<string, number> = {};
      for (const s of payload.sessions) {
        const d = new Date(s.startTime);
        const k = d.toISOString().substring(0, 10);
        map[k] = (map[k] || 0) + (s.cardsStudied || 0);
      }
      setTimeout(() => this["emit"]("message", { map }), 0);
    }
  },
}));

// searchIndexWorker success (parallel indexing)
vi.mock("@/workers/searchIndexWorker?worker", () => ({
  default: class SearchIndexWorker extends BaseMockWorker {
    postMessage(payload: any) {
      const entries: Array<{ term: string; cardId: string }> = [];
      for (const c of payload.cards) {
        const tokens = (c.frontText + " " + c.backText)
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2);
        for (const t of tokens) {
          entries.push({ term: t, cardId: c.id });
        }
      }
      setTimeout(() => this["emit"]("message", { entries }), 0);
    }
  },
}));

// studyQueueWorker success path
vi.mock("@/workers/studyQueueWorker?worker", () => ({
  default: class StudyQueueWorker extends BaseMockWorker {
    postMessage(payload: any) {
      // Mark first half due, second half fresh limited by dailyNewLimit
      const dueIds: string[] = [];
      const freshIds: string[] = [];
      for (const c of payload.cards.slice(
        0,
        Math.min(50, payload.cards.length)
      )) {
        if (dueIds.length < 25) dueIds.push(c.id);
        else if (freshIds.length < payload.dailyNewLimit) freshIds.push(c.id);
      }
      setTimeout(() => this["emit"]("message", { dueIds, freshIds }), 0);
    }
  },
}));

// fuzzySearchWorker success path
vi.mock("@/workers/fuzzySearchWorker?worker", () => ({
  default: class FuzzyWorker extends BaseMockWorker {
    postMessage() {
      setTimeout(() => this.emit("message", { orderedIds: ["c2", "c1"] }), 0);
    }
  },
}));

// Utility factory card
const card = (id: string, extras: any = {}) => ({
  id,
  deckId: "d1",
  frontText: "Front " + id,
  backText: "Back " + id,
  nextReview: Date.now() - 1000,
  totalReviews: 0,
  interval: 0,
  ...extras,
});

describe("Ultra coverage – parallel & edge branches", () => {
  it("HeatmapStatsService parallel worker success path", async () => {
    const now = Date.now();
    const sessions = Array.from({ length: 800 }, (_, i) => ({
      startTime: now - (i % 7) * 86400000 + ((i * 321) % 50_000),
      cardsStudied: (i % 4) + 1,
    }));
    const { HeatmapStatsService } = await import(
      "@/application/services/HeatmapStatsService"
    );
    const svc = new HeatmapStatsService({
      getRecent: async () => sessions,
    } as any);
    const out = await svc.getLastNDays(10);
    expect(out.length).toBe(10);
    expect(out.some((d) => d.reviews > 0)).toBe(true);
  });

  it("SearchIndexService rebuildAll parallel + fuzzy worker success", async () => {
    const bigCards = Array.from({ length: 1600 }, (_, i) => ({
      id: "c" + i,
      frontText: "Alpha " + i,
      backText: "Beta " + i,
    }));
    (globalThis as any).aribaDB.cards.count = async () => bigCards.length;
    const repo = { getAll: async () => bigCards };
    const { SearchIndexService } = await import(
      "@/application/services/SearchIndexService"
    );
    const svc = new SearchIndexService(repo);
    const res: any = await svc.rebuildAll();
    expect(res.parallel).toBe(true);
    // fuzzy path
    const fuzzy = await svc.search("alpha", { ranking: "fuzzy" });
    expect(Array.isArray(fuzzy)).toBe(true);
  });

  it("StudySessionService parallel worker success (no fallback)", async () => {
    const manyCards = Array.from({ length: 2100 }, (_, i) => card("c" + i));
    // SpacedRepetitionService stub that would throw if fallback used (to detect unexpected path)
    const srs = {
      getStudyQueue: () => {
        throw new Error("fallback should not be used");
      },
      schedule: vi.fn(),
    };
    const cardRepo = {
      getAll: async () => manyCards,
      getById: async () => null,
      update: vi.fn(),
    };
    const sessionRepo = {
      create: vi.fn(),
      getRecent: vi.fn(),
      getByDeck: vi.fn(),
    };
    const { StudySessionService } = await import(
      "@/application/services/StudySessionService"
    );
    const svc = new StudySessionService(
      srs as any,
      cardRepo as any,
      sessionRepo as any
    );
    const q = await svc.buildQueue("d1", 10);
    expect(q.length).toBeGreaterThan(0);
  });

  it("PerformanceOptimizer remaining utilities (runChunked, preloadCriticalAssets, autoCleanupListener, warmupGPU, scheduleIdle idleSupported)", async () => {
    const { PerformanceOptimizer } = await import(
      "@/utils/performanceOptimizer"
    );
    // scheduleIdle with requestIdleCallback support
    (globalThis as any).requestIdleCallback = (cb: any) => {
      cb();
      return 1;
    };
    PerformanceOptimizer.scheduleIdle(() => {});
    // runChunked with yield path
    const items = Array.from({ length: 100 }, (_, i) => i);
    await PerformanceOptimizer.runChunked(items, 5, async () => {}, 1);
    // preloadCriticalAssets: mock link element
    const origCreate = document.createElement;
    const origAppend = document.head.appendChild;
    document.createElement = ((tag: string) => {
      const el = origCreate.call(document, tag) as any;
      if (tag === "link") {
        setTimeout(() => {
          if (el.onload) el.onload(new Event("load"));
        }, 0);
      }
      return el;
    }) as any;
    document.head.appendChild = ((node: any) =>
      origAppend.call(document.head, node)) as any;
    await PerformanceOptimizer.preloadCriticalAssets(["a.css"]);
    document.createElement = origCreate;
    document.head.appendChild = origAppend;
    // autoCleanupListener
    const el = document.createElement("div");
    let called = 0;
    const cleanup = PerformanceOptimizer.autoCleanupListener(
      el,
      "click",
      () => {
        called++;
      }
    );
    el.dispatchEvent(new Event("click"));
    cleanup();
    el.dispatchEvent(new Event("click"));
    expect(called).toBe(1);
    // warmupGPU (just ensure it doesn't throw & element removed)
    const before = document.body.children.length;
    PerformanceOptimizer.warmupGPU();
    await new Promise((r) => setTimeout(r, 110));
    expect(document.body.children.length).toBe(before);
  });

  it("AdaptiveStudyScorer edge branches (due clamp / difficulty & retention extremes)", async () => {
    const { AdaptiveStudyScorer } = await import(
      "@/application/services/AdaptiveStudyScorer"
    );
    const scorer = new AdaptiveStudyScorer();
    const now = Date.now();
    const farFuture = now + 9 * 24 * 3600_000; // > 7 days triggers clamp
    const cards: any[] = [
      { id: "c1", nextReview: farFuture, totalReviews: 0, interval: 10 }, // dueFactor -> near 0
      {
        id: "c2",
        nextReview: now - 1000,
        totalReviews: 5,
        easinessFactor: 2.3,
        interval: 1,
      }, // ef <2.4 path
    ];
    const scored = scorer.scoreCards(cards as any, { now, targetDeck: "d1" });
    expect(scored.length).toBe(2);
    // card1 due factor lower than card2 due factor (card2 overdue)
    const c1 = scored.find((s) => s.card.id === "c1")!;
    const c2 = scored.find((s) => s.card.id === "c2")!;
    expect(c1.factors.due).toBeLessThan(c2.factors.due);
  });

  it("CardService countAll optimized path + get null return", async () => {
    const repo = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn().mockResolvedValue(null),
      getByDeck: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(42),
    };
    const { CardService } = await import("@/application/services/CardService");
    const svc = new CardService(repo as any);
    const count = await svc.countAll();
    expect(count).toBe(42);
    const c = await svc.get("x");
    expect(c).toBeNull();
  });

  it("DeckService update/delete error wrapping + validation & success branches", async () => {
    const deck = {
      id: "d1",
      name: "Deck",
      totalCards: 1,
      updated: Date.now(),
      updateStats: vi.fn(),
    };
    const deckRepo = {
      getAll: vi.fn().mockResolvedValue([deck]),
      getById: vi.fn().mockResolvedValue(deck),
      create: vi.fn().mockResolvedValue(deck),
      update: vi.fn().mockRejectedValue(new Error("u")), // force error
      delete: vi.fn().mockRejectedValue(new Error("d")),
    };
    const cardRepo = {
      getByDeck: vi.fn().mockResolvedValue([]),
      deleteByDeck: vi.fn(),
      getAll: vi.fn(),
    };
    const { DeckService } = await import("@/application/services/DeckService");
    const svc = new DeckService(deckRepo as any, cardRepo as any);
    const found = await svc.getDeck("d1");
    expect(found).toBe(deck);
    await expect(svc.updateDeck({} as any)).rejects.toThrow(
      "ID deck invalide ou manquant"
    );
    await expect(svc.updateDeck(deck as any)).rejects.toHaveProperty(
      "code",
      "OPERATION_FAILED"
    );
    await expect(svc.deleteDeck("d1")).rejects.toHaveProperty(
      "code",
      "OPERATION_FAILED"
    );
  });

  it("LearningForecastService per-card error catch branch", async () => {
    const now = Date.now();
    const badCard = {
      id: "b",
      get interval() {
        throw new Error("boom");
      },
      totalReviews: 0,
      correctReviews: 0,
      nextReview: now + 1000,
    };
    const goodCard = {
      id: "g",
      interval: 2,
      easinessFactor: 2.5,
      lastReview: now - 86400000,
      nextReview: now + 1000,
      totalReviews: 2,
      correctReviews: 2,
    };
    const repo = { getAll: async () => [badCard as any, goodCard] };
    const { LearningForecastService } = await import(
      "@/application/services/LearningForecastService"
    );
    const svc = new LearningForecastService(repo as any);
    const snap = await svc.getForecast(true);
    expect(snap.items.some((i) => i.cardId === "g")).toBe(true);
  });
});
