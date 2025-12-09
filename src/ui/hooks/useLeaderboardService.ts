import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import type { ILeaderboardService } from '@/application/services/leaderboard'
import { LEADERBOARD_SERVICE_TOKEN } from '@/application/services/leaderboard'

/**
 * Hook React pour accéder au LeaderboardService via Dependency Injection
 */
export function useLeaderboardService() {
  const [service] = useState<ILeaderboardService>(() => 
    container.resolve<ILeaderboardService>(LEADERBOARD_SERVICE_TOKEN)
  )
  const [isReady, setIsReady] = useState(true)

  useEffect(() => {
    setIsReady(service.isReady())

    return () => {
      // Cleanup si nécessaire
    }
  }, [service])

  return {
    service,
    isReady
  }
}
