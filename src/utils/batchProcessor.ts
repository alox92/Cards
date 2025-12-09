/**
 * 🔄 BATCH PROCESSOR
 * Utilitaire pour traiter de grandes quantités d'opérations IndexedDB
 * sans surcharger les transactions du navigateur
 */

import { logger } from './logger'

export interface BatchOptions {
  batchSize?: number
  onProgress?: (completed: number, total: number) => void
  onError?: (error: any, item: any, index: number) => void
  continueOnError?: boolean
}

/**
 * Traite un tableau d'items en batches pour éviter la surcharge
 * des transactions IndexedDB (limite ~50 transactions simultanées)
 * 
 * @example
 * const results = await processBatch(
 *   items,
 *   async (item) => createCard(item),
 *   { batchSize: 50, onProgress: (done, total) => console.log(`${done}/${total}`) }
 * )
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchOptions = {}
): Promise<R[]> {
  const { 
    batchSize = 50, 
    onProgress, 
    onError,
    continueOnError = false
  } = options
  
  const results: R[] = []
  const errors: Array<{ index: number; error: any; item: T }> = []
  
  logger.info('BatchProcessor', `Démarrage traitement de ${items.length} items par batches de ${batchSize}`)
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length))
    const batchStartIndex = i
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map((item, batchIndex) => 
          processor(item, batchStartIndex + batchIndex)
        )
      )
      
      // Traiter les résultats du batch
      batchResults.forEach((result, batchIndex) => {
        const globalIndex = batchStartIndex + batchIndex
        
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          const error = result.reason
          const item = batch[batchIndex]
          
          errors.push({ index: globalIndex, error, item })
          
          if (onError) {
            onError(error, item, globalIndex)
          } else {
            logger.error('BatchProcessor', `Erreur item ${globalIndex}`, { error, item })
          }
          
          if (!continueOnError) {
            throw new Error(`Batch processing failed at item ${globalIndex}: ${error.message}`)
          }
        }
      })
      
      onProgress?.(results.length, items.length)
      
      // Petite pause entre batches pour libérer le thread et éviter saturation
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
    } catch (error) {
      logger.error('BatchProcessor', `Erreur critique batch ${i}-${i + batch.length}`, { error })
      if (!continueOnError) {
        throw error
      }
    }
  }
  
  logger.info('BatchProcessor', `Traitement terminé: ${results.length} succès, ${errors.length} erreurs`)
  
  if (errors.length > 0 && !continueOnError) {
    throw new Error(`Batch processing completed with ${errors.length} errors`)
  }
  
  return results
}

/**
 * Version séquentielle pour opérations critiques nécessitant ordre strict
 * Plus lent mais garantit l'ordre et évite totalement les problèmes de concurrence
 * 
 * @example
 * const results = await processSequential(
 *   items,
 *   async (item, index) => createCardWithDependency(item, index)
 * )
 */
export async function processSequential<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: { 
    onProgress?: (completed: number, total: number) => void
    onError?: (error: any, item: any, index: number) => void
    continueOnError?: boolean
  } = {}
): Promise<R[]> {
  const { onProgress, onError, continueOnError = false } = options
  const results: R[] = []
  
  logger.info('BatchProcessor', `Démarrage traitement séquentiel de ${items.length} items`)
  
  for (let i = 0; i < items.length; i++) {
    try {
      const result = await processor(items[i], i)
      results.push(result)
      onProgress?.(i + 1, items.length)
    } catch (error) {
      logger.error('BatchProcessor', `Erreur séquentielle item ${i}`, { error, item: items[i] })
      
      if (onError) {
        onError(error, items[i], i)
      }
      
      if (!continueOnError) {
        throw error
      }
    }
  }
  
  logger.info('BatchProcessor', `Traitement séquentiel terminé: ${results.length}/${items.length} succès`)
  
  return results
}

/**
 * Traite en chunks avec callback après chaque chunk
 * Utile pour UI updates ou opérations nécessitant feedback intermédiaire
 */
export async function processChunks<T, R>(
  items: T[],
  processor: (chunk: T[], chunkIndex: number) => Promise<R[]>,
  options: {
    chunkSize?: number
    onChunkComplete?: (results: R[], chunkIndex: number, totalChunks: number) => void
  } = {}
): Promise<R[]> {
  const { chunkSize = 100, onChunkComplete } = options
  const allResults: R[] = []
  const totalChunks = Math.ceil(items.length / chunkSize)
  
  logger.info('BatchProcessor', `Démarrage traitement par chunks: ${totalChunks} chunks de ${chunkSize}`)
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, Math.min(i + chunkSize, items.length))
    const chunkIndex = Math.floor(i / chunkSize)
    
    const chunkResults = await processor(chunk, chunkIndex)
    allResults.push(...chunkResults)
    
    onChunkComplete?.(chunkResults, chunkIndex, totalChunks)
    
    // Pause entre chunks
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 5))
    }
  }
  
  logger.info('BatchProcessor', `Traitement chunks terminé: ${allResults.length} résultats`)
  
  return allResults
}
