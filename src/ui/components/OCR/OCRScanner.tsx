import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOCRService } from '@/ui/hooks/useOCRService'
import type { OCRResult, OCRProgress } from '@/application/services/ocr'
import Icons from '@/ui/components/common/Icons'

interface OCRScannerProps {
  onCardsExtracted: (cards: Array<{ front: string; back: string }>) => void
  onCancel: () => void
  className?: string
}

/**
 * Composant de scan OCR
 * Permet de capturer du texte depuis images/caméra
 */
export const OCRScanner: React.FC<OCRScannerProps> = ({
  onCardsExtracted,
  onCancel,
  className = ''
}) => {
  const [ocrResult, setOCRResult] = useState<OCRResult | null>(null)
  const [progress, setProgress] = useState<OCRProgress | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [extractedCards, setExtractedCards] = useState<Array<{ front: string; back: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { service: ocrService, isReady } = useOCRService()

  // Gestion du fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewURL(url)
    setOCRResult(null)
    setExtractedCards([])
  }

  // Lancer la reconnaissance
  const handleStartOCR = async () => {
    if (!selectedFile || !isReady) return

    setIsProcessing(true)
    try {
      const result = await ocrService.recognizeFromFile(selectedFile, {
        language: 'fra+eng', // Français + Anglais
        onProgress: setProgress
      })

      setOCRResult(result)

      // Extraire automatiquement les cartes
      const cards = await ocrService.extractFlashcards(result)
      setExtractedCards(cards)

      setProgress({
        status: 'completed',
        progress: 1,
        message: `${cards.length} carte(s) détectée(s) !`
      })
    } catch (error) {
      setProgress({
        status: 'error',
        progress: 0,
        message: `Erreur : ${error}`
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Capture depuis caméra
  const handleCameraCapture = async () => {
    if (!isReady) return
    
    setIsProcessing(true)
    try {
      const result = await ocrService.recognizeFromCamera({
        language: 'fra+eng',
        onProgress: setProgress
      })

      setOCRResult(result)
      const cards = await ocrService.extractFlashcards(result)
      setExtractedCards(cards)

      setProgress({
        status: 'completed',
        progress: 1,
        message: `${cards.length} carte(s) détectée(s) !`
      })
    } catch (error) {
      setProgress({
        status: 'error',
        progress: 0,
        message: `Erreur caméra : ${error}`
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`ocr-scanner ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📸 Scanner OCR
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Transformez vos notes en cartes flash
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            <Icons.Settings size="md" />
          </button>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Icons.Upload size="md" />
            Choisir une image
          </button>
          <button
            onClick={handleCameraCapture}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Icons.Settings size="md" />
            Capturer photo
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Prévisualisation */}
        {previewURL && (
          <div className="mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <img
                src={previewURL}
                alt="Preview"
                className="max-h-[300px] mx-auto rounded"
              />
            </div>
            {!ocrResult && (
              <button
                onClick={handleStartOCR}
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                🚀 Lancer la reconnaissance
              </button>
            )}
          </div>
        )}

        {/* Barre de progression */}
        <AnimatePresence>
          {progress && progress.status !== 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {progress.message}
                </span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  {Math.round(progress.progress * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Résultats OCR */}
        {ocrResult && (
          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Texte reconnu
                </h3>
                <div className="text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {ocrResult.confidence.toFixed(1)}% confiance
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({ocrResult.processingTime}ms)
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3 max-h-[200px] overflow-y-auto text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ocrResult.text}
              </div>
            </div>
          </div>
        )}

        {/* Cartes extraites */}
        {extractedCards.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              📚 Cartes détectées ({extractedCards.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {extractedCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4"
                >
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Question :
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {card.front}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Réponse :
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {card.back}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => onCardsExtracted(extractedCards)}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
              >
                ✓ Créer {extractedCards.length} carte(s)
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OCRScanner
