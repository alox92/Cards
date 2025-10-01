// Système centralisé de feature flags / phases de réintégration
// Chaque flag peut être forcé via localStorage (cards.ff.<flag>) ou via param URL ?ff=flag1,flag2

export type FeatureFlag =
  | 'diagnostics'
  | 'advancedAnimations'
  | 'workerSearch'
  | 'adaptiveLearning'
  | 'richTextEditor'
  | 'performanceBudgets'
  | 'logBatching'
  | 'studyWorkspaceV2'

interface FlagDefinition {
  description: string
  default: boolean
  risky?: boolean
  dependsOn?: FeatureFlag[]
}

const registry: Record<FeatureFlag, FlagDefinition> = {
  diagnostics: { description: 'Système de diagnostics et logger avancé', default: true },
  advancedAnimations: { description: 'Transitions complexes / 3D', default: true, risky: true },
  workerSearch: { description: 'Indexation & recherche via Web Workers', default: true, risky: true },
  adaptiveLearning: { description: 'Intelligent Learning System complet', default: true, risky: true },
  richTextEditor: { description: 'Ultra Rich Text Editor pour création cartes', default: true },
  performanceBudgets: { description: 'Instrumentation budgets perf (TTFB/FCP/CLS/Memory)', default: false },
  logBatching: { description: 'Batching & flush amélioré des logs', default: true },
  studyWorkspaceV2: { description: 'Nouveau StudyWorkspace (Flip amélioré, focus)', default: true }
}

function readOverrides(): Partial<Record<FeatureFlag, boolean>> {
  const overrides: Partial<Record<FeatureFlag, boolean>> = {}
  try {
    // localStorage overrides
    Object.keys(registry).forEach(k => {
      const v = localStorage.getItem(`cards.ff.${k}`)
      if(v==='1') overrides[k as FeatureFlag] = true
      if(v==='0') overrides[k as FeatureFlag] = false
    })
    // URL param (?ff=flag1,!flag2)
    if(typeof window !== 'undefined'){
      const sp = new URLSearchParams(window.location.search)
      const ff = sp.get('ff')
      if(ff){
        ff.split(',').map(s=>s.trim()).filter(Boolean).forEach(tok=>{
          if(tok.startsWith('!')){ const name = tok.slice(1) as FeatureFlag; overrides[name] = false }
          else { overrides[tok as FeatureFlag] = true }
        })
      }
    }
  } catch {/* ignore */}
  return overrides
}

const overrides = readOverrides()

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const def = registry[flag]
  if(!def) return false
  if(overrides[flag] !== undefined) return overrides[flag] as boolean
  // dépendances
  if(def.dependsOn && def.dependsOn.some(dep => !isFeatureEnabled(dep))) return false
  return def.default
}

export function getAllFeatureStates(){
  return Object.entries(registry).map(([k,v])=> ({
    flag: k as FeatureFlag,
    enabled: isFeatureEnabled(k as FeatureFlag),
    description: v.description,
    risky: v.risky
  }))
}

export function setFeatureFlag(flag: FeatureFlag, value: boolean){
  try { localStorage.setItem(`cards.ff.${flag}`, value? '1':'0'); (overrides as any)[flag] = value } catch {/* ignore */}
}

// Hook léger
import { useSyncExternalStore } from 'react'

function subscribe(listener: ()=>void){
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}

export function useFeatureFlag(flag: FeatureFlag){
  return useSyncExternalStore(subscribe, ()=> isFeatureEnabled(flag))
}

export function useFeatureFlags(){
  return useSyncExternalStore(subscribe, ()=> getAllFeatureStates())
}
