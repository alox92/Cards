import { bench, describe } from 'vitest'
import { sm2Update } from '@/domain/algorithms/sm2'

// Micro bench Phase 4: coût calcul SM2 et boucle queue simulée
function mockCard(i:number){
  return { easinessFactor: 2.5, interval: 0, repetition: 0, lastReview: Date.now()-86400000, nextReview: Date.now(), id: 'c'+i }
}

const cards = Array.from({length: 5000}, (_,i)=> mockCard(i))

describe('studyQueue performance', () => {
  bench('sm2Update x5000', () => {
    for(let i=0;i<cards.length;i++){
      sm2Update({
        easinessFactor: cards[i].easinessFactor,
        interval: cards[i].interval,
        repetition: cards[i].repetition,
        lastReview: cards[i].lastReview,
        nextReview: cards[i].nextReview,
        quality: 4
      })
    }
  })
})
