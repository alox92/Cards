import { useState, useEffect } from 'react'
import { container } from '@/application/Container'
import type { IPushNotificationService } from '@/application/services/pushNotification/IPushNotificationService'
import { PUSH_NOTIFICATION_SERVICE_TOKEN } from '@/application/services/pushNotification/IPushNotificationService'

/**
 * Hook React pour accéder au service de notifications push via DI
 */
export function usePushNotificationService() {
  const [service] = useState<IPushNotificationService>(() =>
    container.resolve<IPushNotificationService>(PUSH_NOTIFICATION_SERVICE_TOKEN)
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
