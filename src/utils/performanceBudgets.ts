// Budgets de performance centralisés + validation
// Permet d'ajuster les objectifs sans parcourir plusieurs fichiers.

export interface PerformanceBudgets {
  fpsTarget: number;
  fpsMinAcceptable: number;
  memorySoftLimitMB: number;
  memoryHardLimitMB: number;
  interactionMaxLatencyMs: number;
  initialLoadMaxMs: number;
}

export const PERFORMANCE_BUDGETS: PerformanceBudgets = {
  fpsTarget: 60,
  fpsMinAcceptable: (import.meta as any).env?.DEV ? 10 : 30,
  memorySoftLimitMB: (import.meta as any).env?.DEV ? 300 : 80,
  memoryHardLimitMB: (import.meta as any).env?.DEV ? 600 : 120,
  interactionMaxLatencyMs: 120,
  initialLoadMaxMs: (import.meta as any).env?.DEV ? 5000 : 2500,
};

export function validateBudgets(overrides: Partial<PerformanceBudgets> = {}) {
  const merged = { ...PERFORMANCE_BUDGETS, ...overrides };
  if (merged.fpsMinAcceptable > merged.fpsTarget)
    throw new Error("fpsMinAcceptable > fpsTarget");
  if (merged.memorySoftLimitMB > merged.memoryHardLimitMB)
    throw new Error("memorySoftLimitMB > memoryHardLimitMB");
  return merged;
}
