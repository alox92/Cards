// GPU Warmup utilities (Phase 1). Keep minimal & optional.
// Avoid heavy synchronous work; schedule in idle time.

export function warmupGPU(): void {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if(!gl) return
    const buffer = (gl as WebGLRenderingContext).createBuffer()
    if(!buffer) return
    ;(gl as WebGLRenderingContext).bindBuffer((gl as WebGLRenderingContext).ARRAY_BUFFER, buffer)
    ;(gl as WebGLRenderingContext).bufferData((gl as WebGLRenderingContext).ARRAY_BUFFER, new Float32Array([0,0,0,0,0,0]), (gl as WebGLRenderingContext).STATIC_DRAW)
  } catch {}
}

export function scheduleGPUWarmup(delay = 300){
  if('requestIdleCallback' in window){
    setTimeout(()=> (window as any).requestIdleCallback(()=> warmupGPU(), { timeout: 1000 }), delay)
  } else {
    setTimeout(()=> warmupGPU(), delay)
  }
}
