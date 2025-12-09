import { useState, useEffect } from 'react'
import { container } from '@/application/Container'
import type { IForgettingCurveService } from '@/application/services/forgettingCurve/IForgettingCurveService'
import { FORGETTING_CURVE_SERVICE_TOKEN } from '@/application/services/forgettingCurve'

/**
 * Hook pour utiliser le ForgettingCurveService via DI
 */
export function useForgettingCurveService() {
  const [service] = useState<IForgettingCurveService>(() =>
    container.resolve<IForgettingCurveService>(FORGETTING_CURVE_SERVICE_TOKEN)
  )
  
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(service.isReady())
  }, [service])

  return { service, isReady }
}
