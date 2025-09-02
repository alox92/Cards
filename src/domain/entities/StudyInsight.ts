export interface StudyInsight {
  id: string
  type: 'leech' | 'due_surge' | 'stagnation' | 'fast_lane' | 'slow_response' | 'tag_gap'
  severity: 'info' | 'warn' | 'critical'
  title: string
  detail: string
  meta?: Record<string, any>
  created: number
}

export interface InsightSnapshot {
  generatedAt: number
  insights: StudyInsight[]
}
