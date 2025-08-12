import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export const RouteTransitionLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [animKey, setAnimKey] = useState(location.pathname)
  const timerRef = useRef<number>()

  useEffect(() => {
    setProgress(0)
    setAnimKey(location.pathname)
    const start = performance.now()
    const step = () => {
      const elapsed = performance.now() - start
      const pct = Math.min(95, (elapsed / 700) * 100)
      setProgress(pct)
      if (pct < 95) timerRef.current = requestAnimationFrame(step)
    }
    timerRef.current = requestAnimationFrame(step)
    return () => { if(timerRef.current) cancelAnimationFrame(timerRef.current) }
  }, [location])

  useEffect(() => { const to = setTimeout(() => setProgress(100), 250); return () => clearTimeout(to) }, [animKey])

  return (
    <div className="relative">
      <motion.div className="fixed top-0 left-0 h-1 z-50 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-purple-600" animate={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }} transition={{ ease:'easeOut', duration:0.25 }} />
      <AnimatePresence mode="wait">
        <motion.div key={animKey} className="fixed inset-0 -z-10 pointer-events-none" initial={{ opacity:0 }} animate={{ opacity:1, background:`radial-gradient(circle at 30% 30%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.12), transparent 65%)` }} exit={{ opacity:0 }} transition={{ duration:0.6, ease:'easeOut' }} />
      </AnimatePresence>
      {children}
    </div>
  )
}
export default RouteTransitionLayer
