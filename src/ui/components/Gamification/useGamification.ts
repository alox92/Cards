import { useCallback } from 'react'

// Hook pour utiliser le système de gamification
export const useGamification = () => {
  const triggerEvent = useCallback((event: string, data: any = {}) => {
    if (typeof window !== 'undefined' && (window as any).aribaGamification) {
      (window as any).aribaGamification.triggerEvent(event, data)
    }
  }, [])

  const addXP = useCallback((amount: number, reason?: string) => {
    if (typeof window !== 'undefined' && (window as any).aribaGamification) {
      (window as any).aribaGamification.addXP(amount, reason)
    }
  }, [])

  return {
    triggerEvent,
    addXP
  }
}

export default useGamification
