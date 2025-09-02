import { bench, describe } from 'vitest'
import { sm2Update } from '@/domain/algorithms/sm2'

const states = Array.from({length: 2000}, (_,i)=> ({ easinessFactor: 2.5, interval: 0, repetition: 0, lastReview: Date.now()- i*1000, nextReview: Date.now(), quality: 4 }))

describe('recordReview core scheduling', () => {
  bench('sm2Update single', () => {
    sm2Update(states[0])
  })
  bench('sm2Update batch 2000', () => {
    for(let i=0;i<states.length;i++) sm2Update(states[i])
  })
})
