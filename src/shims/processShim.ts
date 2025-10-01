// Minimal shim to avoid ReferenceError: process is not defined in browser
// Used only for safety; prefer import.meta.env for config in browser code
// Avoid global type redeclaration: use a private symbol to store a shim
type MinimalProcess = { env: Record<string, string | undefined> }
declare global { interface Window { __processShim?: MinimalProcess } }

const g: any = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : {})
if (g && g.process == null) {
  const shim: MinimalProcess = { env: {} }
  g.__processShim = shim
  try { g.process = shim } catch { /* non-fatal */ }
}

export {}
