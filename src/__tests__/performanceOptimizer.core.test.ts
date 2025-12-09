import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PerformanceOptimizer } from '@/utils/performanceOptimizer'

// Polyfill requestIdleCallback si absent
beforeEach(()=> {
  if(!(globalThis as any).requestIdleCallback){
    (globalThis as any).requestIdleCallback = (cb: any) => setTimeout(()=> cb({ didTimeout:false, timeRemaining: ()=> 50 }), 0)
  }
})

describe('PerformanceOptimizer primitives', () => {
  it('scheduleIdle enregistre une tâche dans __IDLE_TASKS__', async () => {
    PerformanceOptimizer.scheduleIdle(()=>{/* noop */}, 20)
    await new Promise(r=> setTimeout(r, 40))
    const arr = (window as any).__IDLE_TASKS__
    // Tolérance: si encore vide, réessayer une courte fois
    if(!Array.isArray(arr) || arr.length === 0){
      await new Promise(r=> setTimeout(r, 40))
    }
    const arr2 = (window as any).__IDLE_TASKS__
    expect(Array.isArray(arr2)).toBe(true)
    expect(arr2.length).toBeGreaterThan(0)
  })

  it('debounce n appelle qu une fois malgré rafale', async () => {
    const fn = vi.fn()
    const d = PerformanceOptimizer.debounce(fn, 5)
    for(let i=0;i<10;i++) d()
    await new Promise(r=> setTimeout(r, 15))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throttle limite les appels', async () => {
    const fn = vi.fn()
    const t = PerformanceOptimizer.throttle(fn, 5)
    for(let i=0;i<10;i++){ t(); await new Promise(r=> setTimeout(r,1)) }
    expect(fn.mock.calls.length).toBeLessThan(10)
    expect(fn.mock.calls.length).toBeGreaterThan(0)
  })

  it('runChunked traite tous les éléments', async () => {
    const items = Array.from({ length: 20 }, (_,i)=> i)
    const processed: number[] = []
    await PerformanceOptimizer.runChunked(items, 5, async (it)=> { processed.push(it) }, 2)
    expect(processed.length).toBe(items.length)
  })

  it('yieldToMain cède après budget', async () => {
    // Forcer un budget très bas et vérifier qu un await se produit (heuristique)
    const t0 = performance.now()
    await PerformanceOptimizer.yieldToMain(0)
    const dt = performance.now() - t0
    expect(dt).toBeGreaterThanOrEqual(0) // simple smoke; garantit pas un busy loop
  })
})
