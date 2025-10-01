import { ReactNode, useEffect, useState, useRef } from 'react'
import { container } from '@/application/Container'

// Petit skeleton minimal pour éviter écran blanc
function BootSkeleton({ message }: { message?: string }){
  return <div style={{padding:'2rem', fontFamily:'sans-serif'}}>
    <div style={{fontSize:18, fontWeight:600}}>Initialisation…</div>
    <div style={{marginTop:12, opacity:.7}}>
      {message || 'Chargement des services (Decks, Cartes, Index)…'}
    </div>
  </div>
}

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initPromiseRef = useRef<Promise<boolean> | null>(null)

  useEffect(()=>{
    let cancelled = false

    const initializeServices = async (): Promise<boolean> => {
      // Pattern singleton: une seule initialisation même si plusieurs useEffect triggers
      if (initPromiseRef.current) {
        return initPromiseRef.current
      }

      initPromiseRef.current = (async () => {
        try {
          // Tentative resolve avec backoff
          let attempts = 0
          const maxAttempts = 10
          
          while (attempts < maxAttempts && !cancelled) {
            try {
              const deckService = container.safeResolve<any>('DeckService')
              const cardService = container.safeResolve<any>('CardService')
              
              if (deckService && cardService) {
                if (!cancelled) {
                  setReady(true)
                  setError(null)
                }
                return true
              }
            } catch (err) {
              // Continue retry loop
            }
            
            attempts++
            const delay = Math.min(800, 100 + attempts * 150)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          
          if (!cancelled && attempts >= maxAttempts) {
            setError('Initialisation plus longue que prévu…')
          }
          
          return false
        } catch (error) {
          if (!cancelled) {
            setError('Erreur d\'initialisation des services.')
          }
          return false
        }
      })()

      return initPromiseRef.current
    }

    initializeServices()

    return () => {
      cancelled = true
    }
  }, [])

  if(!ready){
    return <BootSkeleton message={error ?? undefined} />
  }
  return children as any
}

export default ServiceProvider
