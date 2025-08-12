import { ReactNode, useMemo } from 'react'
// Import side-effect: enregistre les singletons du container
import '@/application/Container'

export function ServiceProvider({ children }: { children: ReactNode }) {
  useMemo(() => {
    // Futur: hooks d'observabilité / prefetch
  }, [])
  return children as any
}

export default ServiceProvider
