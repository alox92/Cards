import { useEffect, useState } from 'react'
import { container } from '@/application/Container'
import { INSIGHT_SERVICE_TOKEN, InsightService } from '@/application/services/InsightService'
import type { StudyInsight } from '@/domain/entities/StudyInsight'

export default function useInsights(){
  const [insights, setInsights] = useState<StudyInsight[]>([])
  useEffect(()=>{
    let mounted = true
    const svc = container.resolve<InsightService>(INSIGHT_SERVICE_TOKEN as any)
    const load = async()=>{ const snap = await svc.generate(); if(mounted) setInsights(snap.insights) }
    load()
    const id = setInterval(load, 30000)
    return ()=> { mounted=false; clearInterval(id) }
  }, [])
  return insights
}
