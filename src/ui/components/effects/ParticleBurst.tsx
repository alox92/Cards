import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface ParticleBurstProps { triggerId: number | undefined; intensity: number }

export const ParticleBurst: React.FC<ParticleBurstProps> = ({ triggerId, intensity }) => {
  if(triggerId === undefined) return null
  const count = Math.round(30 + intensity * 70)
  const particles = Array.from({ length: count })
  return (
    <AnimatePresence mode="sync">
      <div key={triggerId} className="pointer-events-none absolute inset-0 overflow-visible">
        {particles.map((_, i) => {
          const angle = (i / count) * Math.PI * 2 + (Math.random()*0.5)
          const dist = 40 + Math.random() * (150 * intensity + 40)
          const x = Math.cos(angle) * dist
          const y = Math.sin(angle) * dist
          const size = 4 + Math.random() * 6 * (0.5 + intensity)
          const hue = Math.round(200 + 140 * intensity + (i%20))
          return (
            <motion.div
              key={i}
              className="absolute rounded-full mix-blend-screen"
              style={{ left:'50%', top:'50%', width:size, height:size, background:`hsla(${hue} 90% 60% / 0.9)` }}
              initial={{ opacity:0, x:0, y:0, scale:0 }}
              animate={{ opacity:[0,1,0], x, y, scale:[0,1,0.2], filter:['blur(0px)','blur(1px)','blur(2px)'] }}
              transition={{ duration: 1.4 + Math.random()*0.4, ease:'easeOut' }}
              exit={{ opacity:0 }}
            />
          )
        })}
      </div>
    </AnimatePresence>
  )
}
export default ParticleBurst
