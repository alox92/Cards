import { useEffect, useRef, useState } from 'react'

export const ThemeCycler = ({ enabled = true, periodMs = 8000 }: { enabled?: boolean; periodMs?: number }) => {
  const [t, setT] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    if(!enabled) return
    let start: number | null = null
    const step = (ts: number) => {
      if(start == null) start = ts
      const elapsed = ts - start
      const phase = (elapsed % periodMs) / periodMs
      setT(phase)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => { if(raf.current) cancelAnimationFrame(raf.current) }
  }, [enabled, periodMs])
  useEffect(() => {
    if(!enabled) return
    const root = document.documentElement
    const hueBase = (t * 360)
    root.style.setProperty('--dyn-accent', `hsl(${hueBase} 85% 60%)`)
    root.style.setProperty('--dyn-accent-soft', `hsl(${(hueBase+40)%360} 90% 75% / 0.35)`) 
  }, [t, enabled])
  return null
}
export default ThemeCycler
