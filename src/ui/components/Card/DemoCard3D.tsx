import { useState } from 'react'
import { motion } from 'framer-motion'

interface DemoCardProps {
  frontText: string
  backText: string
  category: string
  difficulty: number
}

export const DemoCard = ({ frontText, backText, category, difficulty }: DemoCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'from-emerald-400 via-teal-500 to-cyan-600'
      case 2: return 'from-yellow-400 via-orange-500 to-red-500'
      case 3: return 'from-red-400 via-pink-500 to-purple-600'
      default: return 'from-blue-400 via-indigo-500 to-purple-600'
    }
  }

  return (
    <div className="perspective-1000 w-full max-w-sm mx-auto">
      <motion.div
        className="relative w-full h-64 cursor-pointer preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? -10 : 0
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.23, 1, 0.32, 1],
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleFlip}
        whileTap={{ scale: 0.95 }}
      >
        {/* Face avant */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(difficulty)} opacity-90`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20"></div>
            
            {/* Motif décoratif animé */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-4 right-4 w-24 h-24 border-2 border-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute bottom-4 left-4 w-16 h-16 border border-white rounded-full"
              />
            </div>
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
            <div className="flex justify-between items-start">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
              >
                {category}
              </motion.span>
              <div className="flex space-x-1">
                {Array.from({ length: difficulty }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.2, 
                      repeat: Infinity 
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center flex-1 flex items-center justify-center">
              <motion.h2 
                className="text-2xl font-bold leading-tight drop-shadow-lg"
                animate={{ 
                  textShadow: isHovered 
                    ? "0 0 20px rgba(255,255,255,0.8)" 
                    : "0 2px 4px rgba(0,0,0,0.3)" 
                }}
                transition={{ duration: 0.3 }}
              >
                {frontText}
              </motion.h2>
            </div>

            <div className="text-center">
              <motion.div 
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-sm font-medium">Cliquez pour révéler</span>
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.span>
              </motion.div>
            </div>
          </div>

          {/* Effet de brillance au survol */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={isHovered ? { 
              opacity: [0, 0.3, 0],
              x: [-100, 300]
            } : {}}
            transition={{ duration: 1.5 }}
            style={{ transform: 'skewX(-20deg)' }}
          />
        </motion.div>

        {/* Face arrière */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-2xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-90">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10"></div>
            
            {/* Motif décoratif différent */}
            <div className="absolute inset-0 opacity-15">
              <motion.div
                animate={{ 
                  rotate: [0, 45, 90, 135, 180],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-6 left-6 w-12 h-12 border-2 border-white rounded-lg"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute bottom-6 right-6 w-16 h-16 border border-white rounded-lg"
              />
            </div>
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
            <div className="text-right">
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium"
              >
                Réponse
              </motion.span>
            </div>

            <div className="text-center flex-1 flex items-center justify-center">
              <motion.h2 
                className="text-xl font-semibold leading-relaxed drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {backText}
              </motion.h2>
            </div>

            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm font-medium">Cliquez pour retourner</span>
                <motion.span 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🔄
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* Effet de brillance verso */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={isHovered ? { 
              opacity: [0, 0.2, 0],
              x: [-100, 300]
            } : {}}
            transition={{ duration: 1.5, delay: 0.2 }}
            style={{ transform: 'skewX(-20deg)' }}
          />
        </motion.div>

        {/* Ombre dynamique */}
        <div 
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-6 
            bg-black/20 rounded-full blur-lg transition-all duration-300"
          style={{
            transform: `translateX(-50%) ${isHovered ? 'translateY(5px) scale(1.1)' : ''}`,
            opacity: isHovered ? 0.4 : 0.2
          }}
        />
      </motion.div>

      {/* Indicateur de flip */}
      <motion.div
        className="absolute top-4 right-4 z-30 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full 
          flex items-center justify-center shadow-lg"
        animate={{ 
          rotate: isFlipped ? 180 : 0,
          scale: isHovered ? 1.2 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.span 
          className="text-lg"
          animate={{ rotate: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
        >
          🔄
        </motion.span>
      </motion.div>
    </div>
  )
}
