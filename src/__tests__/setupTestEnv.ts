// Polyfill minimal browser APIs for Vitest in Node
// (jsdom fourni via vitest.config.ts)

// ================= IndexedDB Polyfill pour tests ==================
// Utilisation de fake-indexeddb pour environnement de test complet
import "fake-indexeddb/auto";

if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    },
  } as any;
}

// Filtrage des warnings Dexie MissingAPIError (bruit quand IndexedDB absent)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === "string") {
    const msg: string = args[0];
    // Dexie bruit
    if (/MissingAPIError IndexedDB API missing/i.test(msg)) return;
    // React Router future flag warnings
    if (/React Router Future Flag Warning/i.test(msg)) return;
  }
  originalWarn(...args);
};

// Activation virtuelle des future flags React Router pour supprimer les warnings
(globalThis as any).__RR_FUTURE_FLAGS__ = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  // Ajout anticipé (si supporté dans version future)
  v7_partialHydration: true,
};

// Optionnel: exposition pour debug dans tests
(globalThis as any).getRouterFutureFlags = () =>
  (globalThis as any).__RR_FUTURE_FLAGS__;

// ================= Profilage tests (opt-in via TEST_PROFILING=1) ==================
import { afterAll, vi } from "vitest";
import { recordProfileSummary } from "./testProfiler";
if (process.env.TEST_PROFILING === "1") {
  afterAll(() => {
    recordProfileSummary();
  });
}

// Polyfill Blob.arrayBuffer for jsdom
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
