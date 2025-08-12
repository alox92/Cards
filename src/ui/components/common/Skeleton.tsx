import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  shimmer?: boolean
  rounded?: boolean | string
}

// Skeleton de base – réutilisable (donne perception de vitesse)
export const Skeleton: React.FC<SkeletonProps> = ({ className='', shimmer=true, rounded=true }) => {
  const radius = typeof rounded === 'string' ? rounded : (rounded ? '0.75rem' : '0')
  return (
    <motion.div
      aria-hidden
      className={`bg-gray-200/70 dark:bg-gray-700/50 relative overflow-hidden ${className}`}
      style={{ borderRadius: radius }}
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      transition={{ duration:0.25 }}
    >
      {shimmer && (
        <motion.span
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration:1.6, ease:'linear' }}
        />
      )}
    </motion.div>
  )}

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines=3, className='' }) => (
  <div className={`space-y-2 ${className}`}>{Array.from({ length: lines }).map((_,i)=>(<Skeleton key={i} className={`h-3 ${i===0?'w-3/5': i===lines-1?'w-4/5':'w-full'}`} />))}</div>
)

export default Skeleton
