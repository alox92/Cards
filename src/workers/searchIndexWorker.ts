// Worker d'indexation: transforme des cartes en entrées d'index {term, cardId}
// Input: { cards: Array<{ id:string; frontText:string; backText:string }> }
// Output: { entries: Array<{ term:string; cardId:string }> }

export {}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && t.length < 40)
}

self.onmessage = (e: MessageEvent) => {
  const { cards } = e.data as { cards: Array<{ id: string; frontText: string; backText: string }> }
  const out: Array<{ term: string; cardId: string }> = []
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]
    const terms = [...tokenize(c.frontText || ''), ...tokenize(c.backText || '')]
    for (let j = 0; j < terms.length; j++) out.push({ term: terms[j], cardId: c.id })
  }
  ;(self as any).postMessage({ entries: out })
}
