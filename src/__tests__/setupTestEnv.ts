// Polyfill minimal browser APIs for Vitest in Node
// (jsdom fourni via vitest.config.ts)
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string,string> = {}
  globalThis.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    key: (i: number) => Object.keys(store)[i] || null,
    get length() { return Object.keys(store).length }
  } as any
}

// Filtrage des warnings Dexie MissingAPIError (bruit quand IndexedDB absent)
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  if(typeof args[0] === 'string' && /MissingAPIError IndexedDB API missing/i.test(args[0])) return
  originalWarn(...args)
}
