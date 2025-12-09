/**
 * Interface pour le service OCR (Optical Character Recognition)
 * Abstraction pour permettre différentes implémentations (Tesseract, Cloud APIs, etc.)
 */

export interface OCRResult {
  text: string
  confidence: number // 0-100
  blocks: OCRBlock[]
  language: string
  processingTime: number // ms
}

export interface OCRBlock {
  text: string
  confidence: number
  bbox: BoundingBox
  words: OCRWord[]
}

export interface OCRWord {
  text: string
  confidence: number
  bbox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface OCRProgress {
  status: 'initializing' | 'loading' | 'recognizing' | 'completed' | 'error'
  progress: number // 0-1
  message: string
}

export interface OCROptions {
  language?: string
  onProgress?: (progress: OCRProgress) => void
  preprocessImage?: boolean
  timeout?: number
}

export interface FlashcardExtractOptions {
  questionMarker?: RegExp
  answerMarker?: RegExp
  separator?: string
}

export interface Flashcard {
  front: string
  back: string
  confidence?: number
}

export interface HandwritingDetection {
  isHandwritten: boolean
  confidence: number
}

/**
 * Interface du service OCR
 */
export interface IOCRService {
  /**
   * Initialise le service OCR avec une langue
   */
  initialize(language?: string, onProgress?: (progress: OCRProgress) => void): Promise<void>

  /**
   * Reconnaissance de texte depuis une image
   */
  recognizeText(
    image: string | File | HTMLImageElement,
    options?: OCROptions
  ): Promise<OCRResult>

  /**
   * Reconnaissance depuis une URL d'image
   */
  recognizeFromURL(imageUrl: string, options?: OCROptions): Promise<OCRResult>

  /**
   * Reconnaissance depuis un fichier
   */
  recognizeFromFile(file: File, options?: OCROptions): Promise<OCRResult>

  /**
   * Reconnaissance depuis DataURL (base64)
   */
  recognizeFromDataURL(dataUrl: string, options?: OCROptions): Promise<OCRResult>

  /**
   * Reconnaissance depuis un élément canvas
   */
  recognizeFromCanvas(canvas: HTMLCanvasElement, options?: OCROptions): Promise<OCRResult>

  /**
   * Reconnaissance depuis la webcam (capture)
   */
  recognizeFromCamera(options?: OCROptions & { videoConstraints?: MediaStreamConstraints['video'] }): Promise<OCRResult>

  /**
   * Extrait les cartes flash depuis le texte OCR
   */
  extractFlashcards(
    ocrResult: OCRResult,
    patterns?: FlashcardExtractOptions
  ): Promise<Flashcard[]>

  /**
   * Détecte si l'image contient du texte manuscrit
   */
  detectHandwriting(image: string | File): Promise<HandwritingDetection>

  /**
   * Change la langue de reconnaissance
   */
  setLanguage(language: string): Promise<void>

  /**
   * Langues supportées
   */
  getSupportedLanguages(): string[]

  /**
   * Nettoie et termine le worker
   */
  dispose(): Promise<void>

  /**
   * Obtenir l'état d'initialisation
   */
  isReady(): boolean
}

export const OCR_SERVICE_TOKEN = 'OCRService'
