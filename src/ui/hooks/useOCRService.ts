/**
 * Hook React pour utiliser le service OCR
 * Utilise le pattern DI via Container
 */

import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import type { IOCRService } from '@/application/services/ocr'
import { OCR_SERVICE_TOKEN } from '@/application/services/ocr'

export function useOCRService() {
  const [service] = useState<IOCRService>(() => 
    container.resolve<IOCRService>(OCR_SERVICE_TOKEN)
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialiser le service au montage
    const init = async () => {
      if (!service.isReady()) {
        await service.initialize('eng')
      }
      setIsReady(service.isReady())
    }

    void init()

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
