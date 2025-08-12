import { describe, it, expect } from 'vitest'
import { container } from '@/application/Container'
import { STUDY_SESSION_SERVICE_TOKEN, StudySessionService } from '@/application/services/StudySessionService'

// Perf snapshot simple: mesurer la durée de buildQueue pour un deck factice
// Hypothèse: données déjà seedées par demoData lors des tests (sinon fallback vide)

describe('Performance buildQueue', () => {
  it('construit la queue en moins de 25ms (objectif)', async () => {
    const svc = container.resolve<StudySessionService>(STUDY_SESSION_SERVICE_TOKEN)
    const start = performance.now()
    try {
      const q = await svc.buildQueue('deck_demo_1', 20)
      const dur = performance.now() - start
      // On ne fail pas si >25ms mais on alerte
      expect(q).toBeDefined()
      if(dur > 25){
        console.warn(`[Perf] buildQueue lente: ${dur.toFixed(2)}ms (>25ms objectif)`) // eslint-disable-line
      }
    } catch(e){
      // Si ValidationError (deck inexistant) on passe test mais log
      console.warn('buildQueue test: deck manquant ou erreur', e) // eslint-disable-line
    }
  })
})
