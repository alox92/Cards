/**
 * Hook React pour utiliser le service Chat
 * Utilise le pattern DI via Container
 */

import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import type { IChatService } from '@/application/services/chat'
import { CHAT_SERVICE_TOKEN } from '@/application/services/chat'

export function useChatService() {
  const [service] = useState<IChatService>(() => 
    container.resolve<IChatService>(CHAT_SERVICE_TOKEN)
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(service.isReady())

    // Cleanup au démontage
    return () => {
      void service.dispose()
    }
  }, [service])

  return {
    service,
    isReady
  }
}
