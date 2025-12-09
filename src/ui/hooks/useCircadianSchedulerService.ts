import { useState, useEffect } from 'react'
import { container } from '@/application/Container'
import type { ICircadianSchedulerService } from '@/application/services/circadianScheduler/ICircadianSchedulerService'
import { CIRCADIAN_SCHEDULER_SERVICE_TOKEN } from '@/application/services/circadianScheduler/ICircadianSchedulerService'

/**
 * Hook React pour accéder au service de planification circadienne via DI
 */
export function useCircadianSchedulerService() {
  const [service] = useState<ICircadianSchedulerService>(() =>
    container.resolve<ICircadianSchedulerService>(CIRCADIAN_SCHEDULER_SERVICE_TOKEN)
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(service.isReady())
  }, [service])

  return {
    service,
    isReady
  }
}
