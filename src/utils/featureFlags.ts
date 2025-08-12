// Centralisation des feature flags liés aux diagnostics & optimisation
// Les flags peuvent être forcés via variables Vite: VITE_ENABLE_DIAGNOSTICS, VITE_ENABLE_LOG_BATCHING

export const FLAGS = {
  diagnosticsEnabled: (import.meta as any).env?.DEV || (import.meta as any).env?.VITE_ENABLE_DIAGNOSTICS === 'true',
  logBatchingEnabled: (import.meta as any).env?.DEV || (import.meta as any).env?.VITE_ENABLE_LOG_BATCHING === 'true'
}

export default FLAGS
