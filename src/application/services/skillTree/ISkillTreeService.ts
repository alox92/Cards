/**
 * Interface pour le service d'arbre de compétences
 * Gère la progression visuelle et le système de déblocage
 */

// Types exportés
export interface SkillNode {
  id: string
  name: string
  description: string
  icon: string
  category: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'
  
  // Système de déblocage
  unlocked: boolean
  prerequisites: string[] // IDs des nœuds requis
  cost: number // Points requis pour débloquer
  
  // Position visuelle
  x: number
  y: number
  
  // Progression
  progress: number // 0-100
  rewardXP: number
  rewardBadge?: string
  
  // Métadonnées
  unlockedAt?: number
  completedAt?: number
}

export interface SkillTree {
  id: string
  name: string
  description: string
  nodes: SkillNode[]
  totalProgress: number // 0-100
  unlockedNodesCount: number
  availablePoints: number
}

export interface SkillTreeConnection {
  from: string
  to: string
  unlocked: boolean
}

/**
 * Interface du service d'arbre de compétences
 */
export interface ISkillTreeService {
  /**
   * Crée un arbre de compétences par défaut avec tous les nœuds
   */
  createDefaultTree(): Promise<SkillTree>

  /**
   * Vérifie si un nœud peut être débloqué
   */
  canUnlockNode(node: SkillNode, tree: SkillTree): Promise<boolean>

  /**
   * Débloque un nœud dans l'arbre
   */
  unlockNode(nodeId: string, tree: SkillTree): Promise<SkillTree>

  /**
   * Ajoute de la progression à un nœud spécifique
   */
  addProgressToNode(nodeId: string, amount: number, tree: SkillTree): Promise<SkillTree>

  /**
   * Récupère les connexions entre les nœuds de l'arbre
   */
  getConnections(tree: SkillTree): Promise<SkillTreeConnection[]>

  /**
   * Récupère les nœuds disponibles au déblocage
   */
  getAvailableNodes(tree: SkillTree): Promise<SkillNode[]>

  /**
   * Récompense des points pour des actions utilisateur
   */
  awardPoints(amount: number, tree: SkillTree): Promise<SkillTree>

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean

  /**
   * Libère les ressources du service
   */
  dispose(): void
}

/**
 * Token pour l'injection de dépendances
 */
export const SKILL_TREE_SERVICE_TOKEN = Symbol('ISkillTreeService')
