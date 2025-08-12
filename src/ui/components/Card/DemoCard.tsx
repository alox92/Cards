import React from 'react'
import { motion } from 'framer-motion'

interface DemoCardProps {
  frontText: string
  backText: string
  isFlipped?: boolean
  onClick?: () => void
  className?: string
}

export const DemoCard: React.FC<DemoCardProps> = ({
  frontText,
  backText,
  isFlipped = false,
  onClick,
  className = ''
}) => {
  return (
    <motion.div
      className={`relative w-64 h-40 cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Face avant */}
        <div 
          className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center p-4"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center">
            {frontText}
          </p>
        </div>
        
        {/* Face arrière */}
        <div 
          className="absolute inset-0 w-full h-full bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-200 dark:border-blue-700 flex items-center justify-center p-4"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <p className="text-lg font-medium text-blue-800 dark:text-blue-200 text-center">
            {backText}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DemoCard
