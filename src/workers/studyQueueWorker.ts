// Dedicated worker: compute study queue candidates (IDs only) for a chunk of cards
// Input message: { cards: Array<{id:string; deckId:string; nextReview:number; totalReviews:number; created:number}>, deckId: string, dailyNewLimit: number, now: number, buriedIds?: string[] }
// Output message: { dueIds: string[], freshIds: string[] }

export {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: any = self

ctx.onmessage = (e: MessageEvent) => {
  const { cards, deckId, now, buriedIds } = e.data as {
    cards: Array<{ id: string; deckId: string; nextReview: number; totalReviews: number; created: number }>
    deckId: string
    dailyNewLimit: number
    now: number
    buriedIds?: string[]
  }
  const buried = buriedIds ? new Set(buriedIds) : undefined
  const dueIds: string[] = []
  const freshIds: string[] = []
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]
    if (c.deckId !== deckId) continue
    if (buried && buried.has(c.id)) continue
    if (c.nextReview <= now) {
      dueIds.push(c.id)
    } else if (c.totalReviews === 0) {
      freshIds.push(c.id)
    }
  }
  ctx.postMessage({ dueIds, freshIds })
}
