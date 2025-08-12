// Budgets de performance centralisés + validation
// Permet d'ajuster les objectifs sans parcourir plusieurs fichiers.

export interface PerformanceBudgets {
  fpsTarget: number
  fpsMinAcceptable: number
  memorySoftLimitMB: number
  memoryHardLimitMB: number
  interactionMaxLatencyMs: number
  initialLoadMaxMs: number
}

export const PERFORMANCE_BUDGETS: PerformanceBudgets = {
  fpsTarget: 60,
  fpsMinAcceptable: 30,
  memorySoftLimitMB: 80,
  memoryHardLimitMB: 120,
  interactionMaxLatencyMs: 120,
  initialLoadMaxMs: 2500
}

export function validateBudgets(overrides: Partial<PerformanceBudgets> = {}){
  const merged = { ...PERFORMANCE_BUDGETS, ...overrides }
  if(merged.fpsMinAcceptable > merged.fpsTarget) throw new Error('fpsMinAcceptable > fpsTarget')
  if(merged.memorySoftLimitMB > merged.memoryHardLimitMB) throw new Error('memorySoftLimitMB > memoryHardLimitMB')
  return merged
}
