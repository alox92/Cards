import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface SparklineProps { metric: 'reviews'|'accuracy'|'newCards'; points?: number }

// Fake sparkline (no heavy chart lib) for placeholder analytics.
export default function Sparkline({ metric, points = 24 }: SparklineProps){
  const [data, setData] = useState<number[]>([])
  useEffect(()=>{
    // simulate async fetch
    const arr = Array.from({length: points}, (_,i)=> {
      switch(metric){
        case 'reviews': return Math.round(20 + Math.sin(i/2)*10 + Math.random()*5)
        case 'accuracy': return Math.round(70 + Math.sin(i/3)*15 + Math.random()*5)
        case 'newCards': return Math.round(5 + Math.sin(i/1.5)*3 + Math.random()*2)
      }
    }) as number[]
    const t = setTimeout(()=> setData(arr), 150)
    return ()=> clearTimeout(t)
  }, [metric, points])
  const max = Math.max(1, ...data)
  return (
    <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">{metric}</span>
        <span className="text-[10px] text-gray-400">{data.length? data[data.length-1]: '…'}</span>
      </div>
      <div className="h-16 relative">
        {data.length>0 && (
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {data.map((v,i)=>{
              if(i===0) return null
              const x1 = (i-1)/(data.length-1)*100
              const x2 = (i)/(data.length-1)*100
              const y1 = 100 - (data[i-1]/max*100)
              const y2 = 100 - (v/max*100)
              return <line key={i} x1={x1+'%'} y1={y1+'%'} x2={x2+'%'} y2={y2+'%'} stroke="currentColor" strokeWidth={1.5} className="text-blue-500/70 dark:text-blue-400/70" />
            })}
          </svg>
        )}
        {!data.length && <div className="w-full h-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />}
      </div>
      <motion.div initial={{ width:0 }} animate={{ width: data.length? '100%':'0%' }} transition={{ duration:0.6 }} className="h-0.5 mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 rounded" />
    </div>
  )
}
