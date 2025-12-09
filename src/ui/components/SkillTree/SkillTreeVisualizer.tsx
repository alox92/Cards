import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SkillTree, SkillNode, SkillTreeConnection } from '@/application/services/skillTree/ISkillTreeService'
import Icons from '@/ui/components/common/Icons'

interface SkillTreeVisualizerProps {
  tree: SkillTree
  onUnlockNode: (nodeId: string) => void
  className?: string
}

/**
 * Visualiseur interactif d'arbre de compétences
 * Affiche les nœuds, connexions et permet le déblocage
 */
export const SkillTreeVisualizer: React.FC<SkillTreeVisualizerProps> = ({
  tree,
  onUnlockNode,
  className = ''
}) => {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Calculer les connexions
  const connections: SkillTreeConnection[] = []
  tree.nodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      const prereqNode = tree.nodes.find(n => n.id === prereqId)
      connections.push({
        from: prereqId,
        to: node.id,
        unlocked: prereqNode?.unlocked || false
      })
    })
  })

  // Couleurs par catégorie
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner':
        return 'from-green-400 to-green-600'
      case 'intermediate':
        return 'from-blue-400 to-blue-600'
      case 'advanced':
        return 'from-purple-400 to-purple-600'
      case 'expert':
        return 'from-orange-400 to-orange-600'
      case 'master':
        return 'from-yellow-400 to-yellow-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  // Vérifier si un nœud peut être débloqué
  const canUnlock = (node: SkillNode) => {
    if (node.unlocked) return false
    if (tree.availablePoints < node.cost) return false
    return node.prerequisites.every(prereqId => {
      const prereqNode = tree.nodes.find(n => n.id === prereqId)
      return prereqNode?.unlocked === true
    })
  }

  return (
    <div className={`skill-tree-visualizer ${className}`}>
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-lg shadow-2xl p-6 min-h-[900px] relative overflow-hidden">
        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-lg p-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{tree.name}</h2>
              <p className="text-gray-300 text-sm">{tree.description}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-400">
                {tree.availablePoints}
              </div>
              <div className="text-sm text-gray-300">Points disponibles</div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Progression totale</span>
              <span className="text-white font-bold">{tree.totalProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${tree.totalProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="text-sm text-gray-300 mt-1">
              {tree.unlockedNodesCount} / {tree.nodes.length} compétences débloquées
            </div>
          </div>
        </div>

        {/* Grille de l'arbre */}
        <div className="relative h-[700px]">
          {/* SVG pour les connexions */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient id="line-gradient-unlocked" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="line-gradient-locked" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
            </defs>
            {connections.map((conn, index) => {
              const fromNode = tree.nodes.find(n => n.id === conn.from)
              const toNode = tree.nodes.find(n => n.id === conn.to)
              if (!fromNode || !toNode) return null

              return (
                <motion.line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={conn.unlocked ? 'url(#line-gradient-unlocked)' : 'url(#line-gradient-locked)'}
                  strokeWidth={conn.unlocked ? 3 : 2}
                  strokeDasharray={conn.unlocked ? '0' : '5,5'}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: conn.unlocked ? 0.8 : 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                />
              )
            })}
          </svg>

          {/* Nœuds */}
          {tree.nodes.map((node, index) => (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setSelectedNode(node)}
            >
              <motion.div
                className={`relative cursor-pointer`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Cercle de nœud */}
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${getCategoryColor(
                    node.category
                  )} shadow-lg flex items-center justify-center text-4xl ${
                    node.unlocked ? '' : 'grayscale opacity-50'
                  } ${hoveredNode === node.id ? 'ring-4 ring-white/50' : ''}`}
                >
                  {node.icon}
                </div>

                {/* Badge progression */}
                {node.unlocked && node.progress > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-lg">
                    {node.progress}%
                  </div>
                )}

                {/* Badge coût */}
                {!node.unlocked && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {node.cost}
                  </div>
                )}

                {/* Nom du nœud */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="text-white text-sm font-semibold text-center bg-black/50 backdrop-blur-sm px-3 py-1 rounded">
                    {node.name}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Panel de détails */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
            >
              <motion.div
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 max-w-md w-full"
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-5xl">{selectedNode.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedNode.name}</h3>
                      <div className="text-sm text-gray-400 capitalize">{selectedNode.category}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-2 hover:bg-white/10 rounded transition"
                  >
                    <Icons.Settings size="md" className="text-white" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-4">{selectedNode.description}</p>

                {/* Progression */}
                {selectedNode.unlocked && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Progression</span>
                      <span className="text-white font-bold">{selectedNode.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                        style={{ width: `${selectedNode.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Prérequis */}
                {selectedNode.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <div className="text-white font-medium mb-2">Prérequis :</div>
                    <div className="space-y-1">
                      {selectedNode.prerequisites.map(prereqId => {
                        const prereqNode = tree.nodes.find(n => n.id === prereqId)
                        if (!prereqNode) return null
                        return (
                          <div
                            key={prereqId}
                            className={`flex items-center gap-2 text-sm ${
                              prereqNode.unlocked ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {prereqNode.unlocked ? '✓' : '✗'}
                            <span>{prereqNode.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Récompenses */}
                <div className="mb-4 bg-white/5 rounded-lg p-3">
                  <div className="text-white font-medium mb-2">Récompenses :</div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Icons.Settings size="sm" />
                      <span>{selectedNode.rewardXP} XP</span>
                    </div>
                    {selectedNode.rewardBadge && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Icons.Settings size="sm" />
                        <span>Badge: {selectedNode.rewardBadge}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedNode.unlocked ? (
                    <div className="flex-1 py-3 bg-green-600 text-white rounded-lg text-center font-medium">
                      ✓ Débloqué
                    </div>
                  ) : canUnlock(selectedNode) ? (
                    <button
                      onClick={() => {
                        onUnlockNode(selectedNode.id)
                        setSelectedNode(null)
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition shadow-lg"
                    >
                      🔓 Débloquer ({selectedNode.cost} pts)
                    </button>
                  ) : (
                    <div className="flex-1 py-3 bg-gray-700 text-gray-400 rounded-lg text-center font-medium">
                      🔒 Verrouillé
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SkillTreeVisualizer
