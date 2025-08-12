import React, { useEffect, useState, useMemo } from 'react'
import { logger, LogLevel } from '@/utils/logger'

interface FilterState { level: LogLevel; search: string; category: string }

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState(()=> logger.getAllLogs())
  const [filter, setFilter] = useState<FilterState>({ level: LogLevel.DEBUG, search: '', category: '' })
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(()=>{
    const unsub = logger.subscribe(entry => {
      setLogs(prev => [...prev, entry])
    })
    return () => { unsub() }
  },[])

  const filtered = useMemo(()=> logs.filter(l =>
    l.level >= filter.level &&
    (!filter.category || l.category.toLowerCase().includes(filter.category.toLowerCase())) &&
    (!filter.search || (l.message + JSON.stringify(l.data||'')).toLowerCase().includes(filter.search.toLowerCase()))
  ),[logs, filter])

  useEffect(()=>{
    if(autoScroll){
      const el = document.getElementById('log-viewer-scroll')
      if(el) el.scrollTop = el.scrollHeight
    }
  },[filtered, autoScroll])

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg shadow-lg flex flex-col h-80 text-xs font-mono">
      <div className="flex items-center gap-2 p-2 border-b border-gray-700">
        <select value={filter.level} onChange={e=> setFilter(f=> ({...f, level: Number(e.target.value)}))} className="bg-gray-800 px-2 py-1 rounded">
          {Object.keys(LogLevel).filter(k=> isNaN(Number(k))).map(k=> {
            const idx = (LogLevel as any)[k]
            return <option key={k} value={idx}>{k}</option>
          })}
        </select>
        <input placeholder="Catégorie" value={filter.category} onChange={e=> setFilter(f=> ({...f, category: e.target.value}))} className="bg-gray-800 px-2 py-1 rounded flex-1"/>
        <input placeholder="Recherche" value={filter.search} onChange={e=> setFilter(f=> ({...f, search: e.target.value}))} className="bg-gray-800 px-2 py-1 rounded flex-1"/>
        <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none"><input type="checkbox" checked={autoScroll} onChange={e=> setAutoScroll(e.target.checked)} />Auto</label>
        <button onClick={()=> { navigator.clipboard.writeText(logger.exportLogs()) }} className="bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded">Export</button>
        <button onClick={()=> { logger.clearLogs(); setLogs([]) }} className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Clear</button>
      </div>
      <div id="log-viewer-scroll" className="flex-1 overflow-auto p-2 space-y-1">
        {filtered.slice(-500).map((l,i)=> (
          <div key={i} className="whitespace-pre-wrap"><span className="text-gray-500">{l.timestamp.toISOString()}</span> <span className="font-semibold">[{LogLevel[l.level]}]</span> <span className="text-teal-300">[{l.category}]</span> {l.message}</div>
        ))}
      </div>
    </div>
  )
}

export default LogViewer
