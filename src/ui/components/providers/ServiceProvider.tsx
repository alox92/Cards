import { ReactNode, useEffect, useState } from 'react'
import { container } from '@/application/Container'

// Petit skeleton minimal pour éviter écran blanc
function BootSkeleton(){
  return <div style={{padding:'2rem', fontFamily:'sans-serif'}}>
    <div style={{fontSize:18, fontWeight:600}}>Initialisation…</div>
    <div style={{marginTop:12, opacity:.7}}>Chargement des services (Decks, Cartes, Index)…</div>
  </div>
}

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(()=>{
    let cancelled = false
    const tryInit = () => {
      // Forcer initialisation paresseuse du container
      const ds = container.safeResolve<any>('DeckService')
      const cs = container.safeResolve<any>('CardService')
      if(ds && cs){ if(!cancelled) setReady(true); return }
      // Retry exponentiel léger
      const delay = Math.min(800, 100 + attempt*150)
      setTimeout(()=> { if(!cancelled) { setAttempt(a=> a+1); tryInit() } }, delay)
    }
    tryInit()
    return ()=> { cancelled = true }
  }, [attempt])
  if(!ready) return <BootSkeleton />
  return children as any
}

export default ServiceProvider
