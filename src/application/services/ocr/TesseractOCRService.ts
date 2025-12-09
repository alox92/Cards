/**
 * Implémentation du service OCR avec Tesseract.js
 * Hérite de BaseService pour bénéficier du logging et retry logic
 */

import Tesseract, { createWorker } from "tesseract.js";
import { BaseService } from "../base/BaseService";
import type {
  IOCRService,
  OCRResult,
  OCROptions,
  OCRProgress,
  Flashcard,
  FlashcardExtractOptions,
  HandwritingDetection,
  OCRBlock,
} from "./IOCRService";

/**
 * Service OCR basé sur Tesseract.js
 */
export class TesseractOCRService extends BaseService implements IOCRService {
  private worker: Tesseract.Worker | null = null;
  private initialized = false;
  private currentLanguage: string = "eng";

  constructor() {
    super({
      name: "TesseractOCRService",
      retryAttempts: 2,
      retryDelay: 1000,
      timeout: 60000, // OCR peut prendre du temps
    });
  }

  /**
   * Initialise le worker Tesseract
   */
  async initialize(
    language: string = "eng",
    onProgress?: (progress: OCRProgress) => void
  ): Promise<void> {
    if (this.initialized && this.currentLanguage === language) {
      this.log("Worker déjà initialisé", { language });
      return;
    }

    await this.executeWithRetry(
      async () => {
        onProgress?.({
          status: "initializing",
          progress: 0,
          message: "Initialisation du moteur OCR...",
        });

        // Terminer le worker précédent si existant
        if (this.worker) {
          await this.worker.terminate();
        }

        this.worker = await createWorker(language, 1, {
          logger: (m) => {
            if (m.status === "loading tesseract core") {
              onProgress?.({
                status: "loading",
                progress: m.progress,
                message: "Chargement du moteur OCR...",
              });
            } else if (m.status === "initializing tesseract") {
              onProgress?.({
                status: "loading",
                progress: 0.5 + m.progress * 0.5,
                message: "Initialisation en cours...",
              });
            }
          },
        });

        this.initialized = true;
        this.currentLanguage = language;

        onProgress?.({
          status: "completed",
          progress: 1,
          message: "OCR prêt !",
        });

        this.log("Worker Tesseract initialisé", { language });
      },
      "initialize",
      {
        retryAttempts: 1, // Pas de retry pour l'initialisation
        shouldRetry: () => false,
      }
    );
  }

  /**
   * Reconnaissance de texte depuis une image
   */
  async recognizeText(
    image: string | File | HTMLImageElement,
    options?: OCROptions
  ): Promise<OCRResult> {
    return this.executeWithRetry(
      async () => {
        // Initialiser si nécessaire
        if (!this.initialized || !this.worker) {
          await this.initialize(options?.language, options?.onProgress);
        }

        const startTime = Date.now();

        options?.onProgress?.({
          status: "recognizing",
          progress: 0,
          message: "Analyse de l'image en cours...",
        });

        const result = await this.worker!.recognize(image);

        const processingTime = Date.now() - startTime;

        // Extraire les blocs de texte
        const blocks: OCRBlock[] = (result.data.blocks || []).map(
          (block: any) => ({
            text: block.text,
            confidence: block.confidence,
            bbox: {
              x: block.bbox.x0,
              y: block.bbox.y0,
              width: block.bbox.x1 - block.bbox.x0,
              height: block.bbox.y1 - block.bbox.y0,
            },
            words: (block.lines || []).flatMap((line: any) =>
              (line.words || []).map((word: any) => ({
                text: word.text,
                confidence: word.confidence,
                bbox: {
                  x: word.bbox.x0,
                  y: word.bbox.y0,
                  width: word.bbox.x1 - word.bbox.x0,
                  height: word.bbox.y1 - word.bbox.y0,
                },
              }))
            ),
          })
        );

        options?.onProgress?.({
          status: "completed",
          progress: 1,
          message: "Reconnaissance terminée !",
        });

        this.log("Texte reconnu", {
          textLength: result.data.text.length,
          confidence: result.data.confidence,
          blocks: blocks.length,
          processingTime,
        });

        return {
          text: result.data.text,
          confidence: result.data.confidence,
          blocks,
          language: options?.language || this.currentLanguage,
          processingTime,
        };
      },
      "recognizeText",
      {
        shouldRetry: (error) =>
          !error.message.includes("Worker not initialized"),
      }
    );
  }

  async recognizeFromURL(
    imageUrl: string,
    options?: OCROptions
  ): Promise<OCRResult> {
    this.log("Reconnaissance depuis URL", { imageUrl });
    return this.recognizeText(imageUrl, options);
  }

  async recognizeFromFile(
    file: File,
    options?: OCROptions
  ): Promise<OCRResult> {
    this.log("Reconnaissance depuis fichier", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    return this.recognizeText(file, options);
  }

  async recognizeFromDataURL(
    dataUrl: string,
    options?: OCROptions
  ): Promise<OCRResult> {
    this.log("Reconnaissance depuis DataURL");
    return this.recognizeText(dataUrl, options);
  }

  async recognizeFromCanvas(
    canvas: HTMLCanvasElement,
    options?: OCROptions
  ): Promise<OCRResult> {
    this.log("Reconnaissance depuis Canvas", {
      width: canvas.width,
      height: canvas.height,
    });
    const dataUrl = canvas.toDataURL("image/png");
    return this.recognizeFromDataURL(dataUrl, options);
  }

  async recognizeFromCamera(
    options?: OCROptions & {
      videoConstraints?: MediaStreamConstraints["video"];
    }
  ): Promise<OCRResult> {
    return this.executeWithRetry(async () => {
      this.log("Démarrage capture caméra");

      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: options?.videoConstraints || { facingMode: "environment" },
      });

      try {
        // Créer un élément vidéo
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();

        // Attendre que la vidéo soit prête
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        // Capturer une image
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0);

        this.log("Image capturée depuis caméra", {
          width: canvas.width,
          height: canvas.height,
        });

        // Reconnaître le texte
        return await this.recognizeFromCanvas(canvas, options);
      } finally {
        // Toujours arrêter la caméra
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }, "recognizeFromCamera");
  }

  async extractFlashcards(
    ocrResult: OCRResult,
    patterns?: FlashcardExtractOptions
  ): Promise<Flashcard[]> {
    return this.executeWithRetry(async () => {
      const cards: Flashcard[] = [];
      const text = ocrResult.text;
      const separator = patterns?.separator || "\n\n";

      // Méthode 1 : Détection Q: ... A: ...
      // Utilisation de \b pour éviter les faux positifs (ex: "What" contenant "a")
      const qaMatches = text.matchAll(
        /(?:^|\s)Q[:\.]?\s*(.+?)\s*(?:^|\s)A[:\.]?\s*(.+?)(?=(?:^|\s)Q[:\.]|$)/gis
      );
      for (const match of qaMatches) {
        const front = match[1].trim();
        const back = match[2].trim();
        if (front && back) {
          cards.push({
            front,
            back,
            confidence: ocrResult.confidence,
          });
        }
      }

      // Méthode 2 : Séparation par lignes vides (si pas de Q/A détecté)
      if (cards.length === 0) {
        const blocks = text.split(separator).filter((b) => b.trim());
        for (let i = 0; i < blocks.length - 1; i += 2) {
          const front = blocks[i].trim();
          const back = blocks[i + 1]?.trim();
          if (front && back) {
            cards.push({
              front,
              back,
              confidence: ocrResult.confidence,
            });
          }
        }
      }

      this.log("Flashcards extraites", { count: cards.length });
      return cards;
    }, "extractFlashcards");
  }

  async detectHandwriting(image: string | File): Promise<HandwritingDetection> {
    return this.executeWithRetry(async () => {
      const result = await this.recognizeText(image);

      // Heuristique : écriture manuscrite a généralement une confiance plus basse
      const avgConfidence = result.confidence;
      const blockVariance = this.calculateBlockVariance(result.blocks);

      const isHandwritten = avgConfidence < 70 && blockVariance > 0.3;

      this.log("Détection écriture manuscrite", {
        isHandwritten,
        avgConfidence,
        blockVariance,
      });

      return {
        isHandwritten,
        confidence: isHandwritten
          ? 1 - avgConfidence / 100
          : avgConfidence / 100,
      };
    }, "detectHandwriting");
  }

  private calculateBlockVariance(blocks: OCRBlock[]): number {
    if (blocks.length === 0) return 0;

    const confidences = blocks.map((b) => b.confidence);
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance =
      confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
      confidences.length;

    return Math.sqrt(variance) / 100; // Normaliser 0-1
  }

  async setLanguage(language: string): Promise<void> {
    this.log("Changement de langue", {
      from: this.currentLanguage,
      to: language,
    });
    await this.dispose();
    await this.initialize(language);
  }

  getSupportedLanguages(): string[] {
    return [
      "afr",
      "amh",
      "ara",
      "asm",
      "aze",
      "aze_cyrl",
      "bel",
      "ben",
      "bod",
      "bos",
      "bul",
      "cat",
      "ceb",
      "ces",
      "chi_sim",
      "chi_tra",
      "chr",
      "cym",
      "dan",
      "deu",
      "dzo",
      "ell",
      "eng",
      "enm",
      "epo",
      "est",
      "eus",
      "fas",
      "fin",
      "fra",
      "frk",
      "frm",
      "gle",
      "glg",
      "grc",
      "guj",
      "hat",
      "heb",
      "hin",
      "hrv",
      "hun",
      "iku",
      "ind",
      "isl",
      "ita",
      "ita_old",
      "jav",
      "jpn",
      "kan",
      "kat",
      "kat_old",
      "kaz",
      "khm",
      "kir",
      "kor",
      "kur",
      "lao",
      "lat",
      "lav",
      "lit",
      "mal",
      "mar",
      "mkd",
      "mlt",
      "msa",
      "mya",
      "nep",
      "nld",
      "nor",
      "ori",
      "pan",
      "pol",
      "por",
      "pus",
      "ron",
      "rus",
      "san",
      "sin",
      "slk",
      "slv",
      "spa",
      "spa_old",
      "sqi",
      "srp",
      "srp_latn",
      "swa",
      "swe",
      "syr",
      "tam",
      "tel",
      "tgk",
      "tgl",
      "tha",
      "tir",
      "tur",
      "uig",
      "ukr",
      "urd",
      "uzb",
      "uzb_cyrl",
      "vie",
      "yid",
    ];
  }

  isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  async dispose(): Promise<void> {
    if (this.worker) {
      this.log("Fermeture du worker Tesseract");
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}
