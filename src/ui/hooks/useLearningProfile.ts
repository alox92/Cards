import { useEffect, useState } from 'react'
import { getIntelligentLearningSystem, IntelligentLearningSystem, LearningRecommendation, LearningProfile } from '@/core/IntelligentLearningSystem'

interface LearningState {
  profile: LearningProfile | null
  recommendations: LearningRecommendation[]
  loading: boolean
}

/**
 * Hook React Phase 5 – fournit profil d'apprentissage et recommandations dynamiques.
 * Écoute les événements 'learningProfileUpdated' et 'recommendations'.
 */
export function useLearningProfile(): LearningState {
  const [state, setState] = useState<LearningState>({ profile: null, recommendations: [], loading: true })

  useEffect(() => {
    const ils: IntelligentLearningSystem = getIntelligentLearningSystem()
    let mounted = true

    const bootstrap = async () => {
      try {
        const profile = ils.getLearningProfile()
        const recs = ils.getRecommendations?.() || []
        if(mounted) setState({ profile, recommendations: recs, loading: false })
        // Si pas de recommandations encore générées, déclencher
        if(recs.length === 0){
          const gen = await ils.generateRecommendations?.()
          if(mounted && gen) setState(s=> ({ ...s, recommendations: gen }))
        }
      } catch {
        if(mounted) setState(s=> ({ ...s, loading: false }))
      }
    }
    bootstrap()

    const onProfile = (e: any) => { setState(s=> ({ ...s, profile: { ...(s.profile||{}), ...(e.detail||{}) } as any })) }
    const onRecs = (e: any) => { setState(s=> ({ ...s, recommendations: [...(e.detail||[])] })) }
    ils.addEventListener('learningProfileUpdated', onProfile as any)
    ils.addEventListener('recommendations', onRecs as any)
    return () => { mounted = false; ils.removeEventListener('learningProfileUpdated', onProfile as any); ils.removeEventListener('recommendations', onRecs as any) }
  }, [])

  return state
}

export default useLearningProfile
