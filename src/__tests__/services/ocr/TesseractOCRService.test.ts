import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TesseractOCRService } from "../../../application/services/ocr/TesseractOCRService";
import { createWorker } from "tesseract.js";

// Mock tesseract.js
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(),
  default: {
    createWorker: vi.fn(),
  },
}));

describe("TesseractOCRService", () => {
  let service: TesseractOCRService;
  let mockWorker: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock worker
    mockWorker = {
      recognize: vi.fn(),
      terminate: vi.fn(),
    };

    (createWorker as any).mockResolvedValue(mockWorker);

    service = new TesseractOCRService();
  });

  afterEach(async () => {
    await service.dispose();
  });

  describe("initialize", () => {
    it("should initialize the worker successfully", async () => {
      const onProgress = vi.fn();
      await service.initialize("fra", onProgress);

      expect(createWorker).toHaveBeenCalledWith("fra", 1, expect.any(Object));
      expect(service.isReady()).toBe(true);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          progress: 1,
        })
      );
    });

    it("should not re-initialize if already initialized with same language", async () => {
      await service.initialize("eng");
      (createWorker as any).mockClear();

      await service.initialize("eng");

      expect(createWorker).not.toHaveBeenCalled();
    });

    it("should re-initialize if language changes", async () => {
      await service.initialize("eng");
      await service.initialize("fra");

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(createWorker).toHaveBeenCalledTimes(2);
    });
  });

  describe("recognizeText", () => {
    it("should recognize text from image", async () => {
      const mockResult = {
        data: {
          text: "Hello World",
          confidence: 95,
          blocks: [
            {
              text: "Hello World",
              confidence: 95,
              bbox: { x0: 0, y0: 0, x1: 100, y1: 20 },
              lines: [
                {
                  words: [
                    {
                      text: "Hello",
                      confidence: 96,
                      bbox: { x0: 0, y0: 0, x1: 40, y1: 20 },
                    },
                    {
                      text: "World",
                      confidence: 94,
                      bbox: { x0: 50, y0: 0, x1: 100, y1: 20 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockWorker.recognize.mockResolvedValue(mockResult);

      const result = await service.recognizeText("test-image.png");

      expect(result.text).toBe("Hello World");
      expect(result.confidence).toBe(95);
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks?.[0]?.words).toHaveLength(2);
    });

    it("should initialize worker if not ready", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: { text: "", confidence: 0, blocks: [] },
      });

      await service.recognizeText("test.png");

      expect(createWorker).toHaveBeenCalled();
    });
  });

  describe("extractFlashcards", () => {
    it("should extract Q/A format cards", async () => {
      const ocrResult = {
        text: "Q: What is JS? A: JavaScript\n\nQ: What is TS? A: TypeScript",
        confidence: 90,
        blocks: [],
        language: "eng",
        processingTime: 100,
      };

      const cards = await service.extractFlashcards(ocrResult);

      expect(cards).toHaveLength(2);
      expect(cards[0]).toEqual({
        front: "What is JS?",
        back: "JavaScript",
        confidence: 90,
      });
      expect(cards[1]).toEqual({
        front: "What is TS?",
        back: "TypeScript",
        confidence: 90,
      });
    });

    it("should extract block-separated cards as fallback", async () => {
      const ocrResult = {
        text: "Front 1\n\nBack 1\n\nFront 2\n\nBack 2",
        confidence: 85,
        blocks: [],
        language: "eng",
        processingTime: 100,
      };

      const cards = await service.extractFlashcards(ocrResult);

      expect(cards).toHaveLength(2);
      expect(cards[0]?.front).toBe("Front 1");
      expect(cards[0]?.back).toBe("Back 1");
    });
  });

  describe("detectHandwriting", () => {
    it("should detect handwriting based on confidence and variance", async () => {
      // Low confidence, high variance -> likely handwritten
      // Mean: 50, Variance: ((10-50)^2 + (90-50)^2)/2 = (1600+1600)/2 = 1600. StdDev = 40. Norm = 0.4 > 0.3
      const mockResult = {
        data: {
          text: "Messy text",
          confidence: 50,
          blocks: [
            { confidence: 10, bbox: { x0: 0, x1: 0, y0: 0, y1: 0 }, lines: [] },
            { confidence: 90, bbox: { x0: 0, x1: 0, y0: 0, y1: 0 }, lines: [] },
          ],
        },
      };

      mockWorker.recognize.mockResolvedValue(mockResult);

      const result = await service.detectHandwriting("handwritten.png");

      expect(result.isHandwritten).toBe(true);
    });

    it("should detect printed text", async () => {
      // High confidence -> likely printed
      const mockResult = {
        data: {
          text: "Clean text",
          confidence: 95,
          blocks: [
            { confidence: 94, bbox: { x0: 0, x1: 0, y0: 0, y1: 0 }, lines: [] },
            { confidence: 96, bbox: { x0: 0, x1: 0, y0: 0, y1: 0 }, lines: [] },
          ],
        },
      };

      mockWorker.recognize.mockResolvedValue(mockResult);

      const result = await service.detectHandwriting("printed.png");

      expect(result.isHandwritten).toBe(false);
    });
  });

  describe("recognizeFromCamera", () => {
    it("should capture and recognize from camera", async () => {
      // Mock navigator.mediaDevices.getUserMedia
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };

      Object.defineProperty(global.navigator, "mediaDevices", {
        value: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
        writable: true,
      });

      const mockContext = {
        drawImage: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockContext),
        toDataURL: vi.fn().mockReturnValue("data:image/png;base64,test"),
      };

      const mockVideo = {
        srcObject: null,
        play: vi.fn().mockResolvedValue(undefined),
        videoWidth: 640,
        videoHeight: 480,
        _onloadedmetadata: null as any,
      };

      // Handle onloadedmetadata setter to trigger immediately
      Object.defineProperty(mockVideo, "onloadedmetadata", {
        set: (handler) => {
          mockVideo._onloadedmetadata = handler;
          if (handler) handler(new Event("loadedmetadata"));
        },
        get: () => mockVideo._onloadedmetadata,
      });

      // Intercept createElement
      const originalCreateElement = document.createElement;
      vi.spyOn(document, "createElement").mockImplementation((tagName) => {
        if (tagName === "video") return mockVideo as any;
        if (tagName === "canvas") return mockCanvas as any;
        return originalCreateElement.call(document, tagName);
      });

      mockWorker.recognize.mockResolvedValue({
        data: { text: "Camera Text", confidence: 90, blocks: [] },
      });

      const result = await service.recognizeFromCamera();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(result.text).toBe("Camera Text");
    });
  });
});
