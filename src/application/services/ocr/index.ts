/**
 * Export centralisé pour le service OCR
 */

export { TesseractOCRService } from './TesseractOCRService'
export { OCR_SERVICE_TOKEN } from './IOCRService'
export type {
  IOCRService,
  OCRResult,
  OCRBlock,
  OCRWord,
  OCRProgress,
  OCROptions,
  Flashcard,
  FlashcardExtractOptions,
  HandwritingDetection,
  BoundingBox
} from './IOCRService'
