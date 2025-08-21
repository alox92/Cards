// Worker pour calculer la heatmap d’activité (sessions par jour)
// Input: { sessions: Array<{ startTime: number, cardsStudied: number }> }
// Output: { map: Record<string, number> }

export {}

self.onmessage = (e: MessageEvent) => {
  const { sessions } = e.data as { sessions: Array<{ startTime: number, cardsStudied: number }> }
  const map: Record<string, number> = {}
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const d = new Date(s.startTime)
    const key = d.toISOString().substring(0, 10)
    map[key] = (map[key] || 0) + (s.cardsStudied || 0)
  }
  ;(self as any).postMessage({ map })
}
