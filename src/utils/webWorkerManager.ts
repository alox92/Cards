/**
 * Enhanced Web Worker Manager for Heavy Computations
 * Moves pure calculations to workers as specified in requirements
 */

export class WebWorkerManager {
  private static instance: WebWorkerManager
  private workers: Map<string, Worker> = new Map()
  private taskQueue: Array<{ id: string; task: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = []
  private activeTaskCount = 0
  private maxConcurrentTasks: number

  private constructor() {
    this.maxConcurrentTasks = Math.min(navigator.hardwareConcurrency || 4, 4)
  }

  static getInstance(): WebWorkerManager {
    if (!WebWorkerManager.instance) {
      WebWorkerManager.instance = new WebWorkerManager()
    }
    return WebWorkerManager.instance
  }

  /**
   * Execute heavy statistical calculations in worker
   */
  async executeStatsCalculation(data: any): Promise<any> {
    return this.executeTask('stats', () => this.createStatsWorker(data))
  }

  /**
   * Execute search indexing in worker
   */
  async executeSearchIndexing(cards: any[]): Promise<any> {
    return this.executeTask('search', () => this.createSearchWorker(cards))
  }

  /**
   * Execute spaced repetition calculations in worker
   */
  async executeSpacedRepetition(reviewData: any): Promise<any> {
    return this.executeTask('sm2', () => this.createSM2Worker(reviewData))
  }

  private async executeTask(workerType: string, taskFactory: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = `${workerType}-${Date.now()}-${Math.random()}`
      
      this.taskQueue.push({
        id: taskId,
        task: taskFactory,
        resolve,
        reject
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.activeTaskCount >= this.maxConcurrentTasks || this.taskQueue.length === 0) {
      return
    }

    const task = this.taskQueue.shift()
    if (!task) return

    this.activeTaskCount++

    try {
      const result = await task.task()
      task.resolve(result)
    } catch (error) {
      task.reject(error)
    } finally {
      this.activeTaskCount--
      // Process next task
      setTimeout(() => this.processQueue(), 0)
    }
  }

  private async createStatsWorker(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create inline worker for stats calculations
      const workerScript = `
        self.onmessage = function(e) {
          const { cards, type } = e.data
          
          try {
            let result = {}
            
            switch (type) {
              case 'advanced_stats':
                result = calculateAdvancedStats(cards)
                break
              case 'retention_analysis':
                result = calculateRetentionAnalysis(cards)
                break
              case 'difficulty_distribution':
                result = calculateDifficultyDistribution(cards)
                break
              default:
                throw new Error('Unknown stats calculation type')
            }
            
            self.postMessage({ success: true, result })
          } catch (error) {
            self.postMessage({ success: false, error: error.message })
          }
        }
        
        function calculateAdvancedStats(cards) {
          const totalCards = cards.length
          const masteredCards = cards.filter(c => c.easinessFactor > 2.5).length
          const averageEF = cards.reduce((sum, c) => sum + (c.easinessFactor || 2.5), 0) / totalCards
          const totalReviews = cards.reduce((sum, c) => sum + (c.totalReviews || 0), 0)
          
          return {
            totalCards,
            masteredCards,
            averageEasinessFactor: Math.round(averageEF * 100) / 100,
            totalReviews,
            masteryRate: Math.round((masteredCards / totalCards) * 100)
          }
        }
        
        function calculateRetentionAnalysis(cards) {
          const now = Date.now()
          const oneDayAgo = now - 24 * 60 * 60 * 1000
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
          
          const dailyRetention = cards.filter(c => 
            c.lastReview && c.lastReview > oneDayAgo && c.correctReviews > 0
          ).length
          
          const weeklyRetention = cards.filter(c => 
            c.lastReview && c.lastReview > oneWeekAgo && c.correctReviews > 0
          ).length
          
          return {
            dailyRetentionRate: Math.round((dailyRetention / cards.length) * 100),
            weeklyRetentionRate: Math.round((weeklyRetention / cards.length) * 100)
          }
        }
        
        function calculateDifficultyDistribution(cards) {
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          
          cards.forEach(card => {
            const difficulty = card.difficulty || 3
            distribution[difficulty] = (distribution[difficulty] || 0) + 1
          })
          
          return Object.entries(distribution).map(([level, count]) => ({
            level: parseInt(level),
            count,
            percentage: Math.round((count / cards.length) * 100)
          }))
        }
      `

      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))

      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error('Stats calculation timeout'))
      }, 10000) // 10 second timeout

      worker.onmessage = (e) => {
        clearTimeout(timeout)
        worker.terminate()
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.onerror = (error) => {
        clearTimeout(timeout)
        worker.terminate()
        reject(error)
      }

      worker.postMessage(data)
    })
  }

  private async createSearchWorker(cards: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const workerScript = `
        self.onmessage = function(e) {
          const cards = e.data
          
          try {
            const searchIndex = buildSearchIndex(cards)
            self.postMessage({ success: true, result: searchIndex })
          } catch (error) {
            self.postMessage({ success: false, error: error.message })
          }
        }
        
        function buildSearchIndex(cards) {
          const index = {
            trigrams: new Map(),
            cardMap: new Map(),
            totalCards: cards.length
          }
          
          cards.forEach((card, cardIndex) => {
            const text = (card.frontText + ' ' + card.backText).toLowerCase()
            const trigrams = extractTrigrams(text)
            
            index.cardMap.set(card.id, {
              index: cardIndex,
              trigrams: trigrams.length,
              text: text.substring(0, 200) // Store preview
            })
            
            trigrams.forEach(trigram => {
              if (!index.trigrams.has(trigram)) {
                index.trigrams.set(trigram, [])
              }
              index.trigrams.get(trigram).push(cardIndex)
            })
          })
          
          // Convert Maps to Objects for transfer
          return {
            trigrams: Object.fromEntries(index.trigrams),
            cardMap: Object.fromEntries(index.cardMap),
            totalCards: index.totalCards,
            indexSize: index.trigrams.size
          }
        }
        
        function extractTrigrams(text) {
          const trigrams = []
          for (let i = 0; i <= text.length - 3; i++) {
            trigrams.push(text.substring(i, i + 3))
          }
          return [...new Set(trigrams)] // Remove duplicates
        }
      `

      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))

      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error('Search indexing timeout'))
      }, 15000) // 15 second timeout

      worker.onmessage = (e) => {
        clearTimeout(timeout)
        worker.terminate()
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.onerror = (error) => {
        clearTimeout(timeout)
        worker.terminate()
        reject(error)
      }

      worker.postMessage(cards)
    })
  }

  private async createSM2Worker(reviewData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const workerScript = `
        self.onmessage = function(e) {
          const { cardData, quality } = e.data
          
          try {
            const result = calculateSM2(cardData, quality)
            self.postMessage({ success: true, result })
          } catch (error) {
            self.postMessage({ success: false, error: error.message })
          }
        }
        
        function calculateSM2(card, quality) {
          let { easinessFactor = 2.5, interval = 1, repetition = 0 } = card
          
          if (quality >= 3) {
            if (repetition === 0) {
              interval = 1
            } else if (repetition === 1) {
              interval = 6
            } else {
              interval = Math.round(interval * easinessFactor)
            }
            repetition++
          } else {
            repetition = 0
            interval = 1
          }
          
          easinessFactor = Math.max(1.3, 
            easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
          )
          
          return {
            easinessFactor: Math.round(easinessFactor * 100) / 100,
            interval,
            repetition,
            nextReview: Date.now() + (interval * 24 * 60 * 60 * 1000)
          }
        }
      `

      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))

      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error('SM2 calculation timeout'))
      }, 5000) // 5 second timeout

      worker.onmessage = (e) => {
        clearTimeout(timeout)
        worker.terminate()
        
        if (e.data.success) {
          resolve(e.data.result)
        } else {
          reject(new Error(e.data.error))
        }
      }

      worker.onerror = (error) => {
        clearTimeout(timeout)
        worker.terminate()
        reject(error)
      }

      worker.postMessage(reviewData)
    })
  }

  /**
   * Cleanup all workers
   */
  cleanup(): void {
    this.workers.forEach(worker => worker.terminate())
    this.workers.clear()
    this.taskQueue.length = 0
    this.activeTaskCount = 0
  }
}

// Export singleton instance
export const webWorkerManager = WebWorkerManager.getInstance()