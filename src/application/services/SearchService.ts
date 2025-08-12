import type { CardEntity } from '@/domain/entities/Card'
import type { CardRepository } from '@/domain/repositories/CardRepository'

export interface SearchQuery { text?: string; deckId?: string; tag?: string; isDue?: boolean }

// MVP simple: filtrage linéaire + toLowerCase
export class SearchService {
  constructor(private repo: Pick<CardRepository, 'getAll'>){ }
  async search(q: SearchQuery): Promise<CardEntity[]> {
    const all = await this.repo.getAll()
    const now = Date.now()
    return all.filter(c => {
      if(q.deckId && c.deckId !== q.deckId) return false
      if(q.tag && !c.tags.includes(q.tag)) return false
      if(q.isDue && c.nextReview > now) return false
      if(q.text){
        const hay = (c.frontText + ' ' + c.backText).toLowerCase()
        if(!hay.includes(q.text.toLowerCase())) return false
      }
      return true
    })
  }
}
export const SEARCH_SERVICE_TOKEN = 'SearchService'
export default SearchService
