import { useState, useEffect } from 'react'
import { container } from '@/application/Container'
import type { ISkillTreeService } from '@/application/services/skillTree/ISkillTreeService'
import { SKILL_TREE_SERVICE_TOKEN } from '@/application/services/skillTree/ISkillTreeService'

/**
 * Hook React pour accéder au service d'arbre de compétences via DI
 */
export function useSkillTreeService() {
  const [service] = useState<ISkillTreeService>(() =>
    container.resolve<ISkillTreeService>(SKILL_TREE_SERVICE_TOKEN)
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
