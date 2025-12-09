import { BaseService } from '@/application/services/base/BaseService'
import type {
  ISkillTreeService,
  SkillNode,
  SkillTree,
  SkillTreeConnection
} from './ISkillTreeService'

/**
 * Service de gestion des arbres de compétences
 * Gère la progression visuelle et le système de déblocage des compétences
 */
export class SkillTreeService extends BaseService implements ISkillTreeService {
  constructor() {
    super({
      name: 'SkillTreeService',
      retryAttempts: 1,
      retryDelay: 500,
      timeout: 5000
    })
    this.log('SkillTreeService initialisé')
  }

  /**
   * Crée un arbre de compétences par défaut avec tous les nœuds
   */
  async createDefaultTree(): Promise<SkillTree> {
    return this.executeWithRetry(async () => {
      const nodes: SkillNode[] = [
        // NIVEAU DÉBUTANT (Tier 1)
        {
          id: 'basic-learner',
          name: 'Apprenti Basique',
          description: 'Créez votre première carte',
          icon: '📝',
          category: 'beginner',
          unlocked: true,
          prerequisites: [],
          cost: 0,
          x: 400,
          y: 100,
          progress: 0,
          rewardXP: 50,
          rewardBadge: 'first-card'
        },
        {
          id: 'first-deck',
          name: 'Créateur de Deck',
          description: 'Créez votre premier deck',
          icon: '📚',
          category: 'beginner',
          unlocked: false,
          prerequisites: ['basic-learner'],
          cost: 50,
          x: 200,
          y: 200,
          progress: 0,
          rewardXP: 100
        },
        {
          id: 'first-review',
          name: 'Premier Réviseur',
          description: 'Révisez 10 cartes',
          icon: '🔄',
          category: 'beginner',
          unlocked: false,
          prerequisites: ['basic-learner'],
          cost: 50,
          x: 600,
          y: 200,
          progress: 0,
          rewardXP: 100
        },

        // NIVEAU INTERMÉDIAIRE (Tier 2)
        {
          id: 'deck-master',
          name: 'Maître des Decks',
          description: 'Possédez 5 decks actifs',
          icon: '📖',
          category: 'intermediate',
          unlocked: false,
          prerequisites: ['first-deck'],
          cost: 100,
          x: 100,
          y: 350,
          progress: 0,
          rewardXP: 250,
          rewardBadge: 'deck-master'
        },
        {
          id: 'streak-keeper',
          name: 'Gardien de Série',
          description: 'Maintenez un streak de 7 jours',
          icon: '🔥',
          category: 'intermediate',
          unlocked: false,
          prerequisites: ['first-review'],
          cost: 100,
          x: 700,
          y: 350,
          progress: 0,
          rewardXP: 300,
          rewardBadge: 'streak-7'
        },
        {
          id: 'speed-learner',
          name: 'Apprenant Rapide',
          description: 'Révisez 100 cartes en 24h',
          icon: '⚡',
          category: 'intermediate',
          unlocked: false,
          prerequisites: ['first-review'],
          cost: 100,
          x: 500,
          y: 350,
          progress: 0,
          rewardXP: 200
        },

        // NIVEAU AVANCÉ (Tier 3)
        {
          id: 'multimedia-expert',
          name: 'Expert Multimédia',
          description: 'Utilisez images et audio',
          icon: '🎨',
          category: 'advanced',
          unlocked: false,
          prerequisites: ['deck-master'],
          cost: 250,
          x: 150,
          y: 500,
          progress: 0,
          rewardXP: 400,
          rewardBadge: 'multimedia'
        },
        {
          id: 'accuracy-master',
          name: 'Maître de la Précision',
          description: 'Atteignez 90% de précision sur 100 cartes',
          icon: '🎯',
          category: 'advanced',
          unlocked: false,
          prerequisites: ['speed-learner', 'streak-keeper'],
          cost: 250,
          x: 600,
          y: 500,
          progress: 0,
          rewardXP: 500,
          rewardBadge: 'accuracy-90'
        },
        {
          id: 'tag-organizer',
          name: 'Organisateur de Tags',
          description: 'Créez 20 tags différents',
          icon: '🏷️',
          category: 'advanced',
          unlocked: false,
          prerequisites: ['deck-master'],
          cost: 200,
          x: 300,
          y: 500,
          progress: 0,
          rewardXP: 300
        },

        // NIVEAU EXPERT (Tier 4)
        {
          id: 'thousand-cards',
          name: 'Mille Cartes',
          description: 'Créez 1000 cartes',
          icon: '💎',
          category: 'expert',
          unlocked: false,
          prerequisites: ['accuracy-master', 'multimedia-expert'],
          cost: 500,
          x: 250,
          y: 650,
          progress: 0,
          rewardXP: 1000,
          rewardBadge: 'thousand-cards'
        },
        {
          id: 'streak-legend',
          name: 'Légende du Streak',
          description: 'Maintenez un streak de 30 jours',
          icon: '🏆',
          category: 'expert',
          unlocked: false,
          prerequisites: ['streak-keeper'],
          cost: 500,
          x: 550,
          y: 650,
          progress: 0,
          rewardXP: 1500,
          rewardBadge: 'streak-30'
        },

        // NIVEAU MAÎTRE (Tier 5)
        {
          id: 'grandmaster',
          name: 'Grand Maître',
          description: 'Débloquez toutes les compétences',
          icon: '👑',
          category: 'master',
          unlocked: false,
          prerequisites: ['thousand-cards', 'streak-legend'],
          cost: 1000,
          x: 400,
          y: 800,
          progress: 0,
          rewardXP: 5000,
          rewardBadge: 'grandmaster'
        }
      ]

      return {
        id: 'main-tree',
        name: 'Arbre de Maîtrise',
        description: 'Progressez à travers les niveaux de compétence',
        nodes,
        totalProgress: 0,
        unlockedNodesCount: 1,
        availablePoints: 0
      }
    }, 'createDefaultTree')
  }

  /**
   * Vérifie si un nœud peut être débloqué
   */
  async canUnlockNode(node: SkillNode, tree: SkillTree): Promise<boolean> {
    return this.executeWithRetry(async () => {
      // Déjà débloqué
      if (node.unlocked) return false

      // Vérifier les points disponibles
      if (tree.availablePoints < node.cost) return false

      // Vérifier les prérequis
      return node.prerequisites.every(prereqId => {
        const prereqNode = tree.nodes.find(n => n.id === prereqId)
        return prereqNode?.unlocked === true
      })
    }, 'canUnlockNode')
  }

  /**
   * Débloque un nœud dans l'arbre
   */
  async unlockNode(nodeId: string, tree: SkillTree): Promise<SkillTree> {
    return this.executeWithRetry(async () => {
      const node = tree.nodes.find(n => n.id === nodeId)
      if (!node) {
        this.error(`Nœud ${nodeId} non trouvé`)
        return tree
      }

      const canUnlock = await this.canUnlockNode(node, tree)
      if (!canUnlock) {
        this.error(`Impossible de débloquer le nœud ${nodeId}`)
        return tree
      }

      return {
        ...tree,
        nodes: tree.nodes.map(n =>
          n.id === nodeId
            ? { ...n, unlocked: true, unlockedAt: Date.now() }
            : n
        ),
        availablePoints: tree.availablePoints - node.cost,
        unlockedNodesCount: tree.unlockedNodesCount + 1,
        totalProgress: this.calculateTotalProgress(tree.nodes, nodeId)
      }
    }, 'unlockNode')
  }

  /**
   * Ajoute de la progression à un nœud spécifique
   */
  async addProgressToNode(
    nodeId: string,
    amount: number,
    tree: SkillTree
  ): Promise<SkillTree> {
    return this.executeWithRetry(async () => {
      return {
        ...tree,
        nodes: tree.nodes.map(n => {
          if (n.id === nodeId && n.unlocked) {
            const newProgress = Math.min(100, n.progress + amount)
            const isCompleted = newProgress === 100 && n.progress < 100

            return {
              ...n,
              progress: newProgress,
              completedAt: isCompleted ? Date.now() : n.completedAt
            }
          }
          return n
        })
      }
    }, 'addProgressToNode')
  }

  /**
   * Récupère les connexions entre les nœuds de l'arbre
   */
  async getConnections(tree: SkillTree): Promise<SkillTreeConnection[]> {
    return this.executeWithRetry(async () => {
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

      return connections
    }, 'getConnections')
  }

  /**
   * Récupère les nœuds disponibles au déblocage
   */
  async getAvailableNodes(tree: SkillTree): Promise<SkillNode[]> {
    return this.executeWithRetry(async () => {
      const availableNodes: SkillNode[] = []

      for (const node of tree.nodes) {
        const canUnlock = await this.canUnlockNode(node, tree)
        if (canUnlock) {
          availableNodes.push(node)
        }
      }

      return availableNodes
    }, 'getAvailableNodes')
  }

  /**
   * Récompense des points pour des actions utilisateur
   */
  async awardPoints(amount: number, tree: SkillTree): Promise<SkillTree> {
    return this.executeWithRetry(async () => {
      return {
        ...tree,
        availablePoints: tree.availablePoints + amount
      }
    }, 'awardPoints')
  }

  /**
   * Calcule la progression totale de l'arbre
   */
  private calculateTotalProgress(nodes: SkillNode[], newlyUnlockedId?: string): number {
    let unlockedCount = nodes.filter(n => n.unlocked).length
    if (newlyUnlockedId) unlockedCount++

    return (unlockedCount / nodes.length) * 100
  }

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean {
    return true
  }

  /**
   * Libère les ressources du service
   */
  dispose(): void {
    this.log('SkillTreeService disposed')
  }
}
