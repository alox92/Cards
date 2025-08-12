import { CARD_REPOSITORY_TOKEN, type CardRepository } from '../../domain/repositories/CardRepository'
import { container } from '../Container'
export interface DaySchedule { day: string; due: number }
export class AgendaScheduler { 
  private cardRepo: CardRepository; 
  constructor(cardRepo?: CardRepository){ this.cardRepo = cardRepo || container.resolve(CARD_REPOSITORY_TOKEN) }
  async yearlyHeatmap(): Promise<DaySchedule[]> { 
    const cards = await this.cardRepo.getAll(); const map = new Map<string,number>();
    for (const c of cards){ const day = new Date(c.nextReview).toISOString().slice(0,10); map.set(day,(map.get(day)||0)+1) }
    return [...map.entries()].map(([day,due])=>({day,due})).sort((a,b)=>a.day.localeCompare(b.day)) 
  }
}
export const AGENDA_SCHEDULER_TOKEN = 'AgendaScheduler'
