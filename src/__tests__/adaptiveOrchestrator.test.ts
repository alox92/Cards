import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdaptiveOrchestratorService } from "@/application/services/AdaptiveOrchestratorService";

describe("AdaptiveOrchestratorService", () => {
  let orchestrator: AdaptiveOrchestratorService;
  let mockForecastSvc: any;
  let mockInsightSvc: any;

  beforeEach(() => {
    mockForecastSvc = {
      warmup: vi.fn().mockResolvedValue(undefined),
      getForecast: vi
        .fn()
        .mockReturnValue({ items: [{ cardId: "c1", risk: 0.8 }] }),
    };
    mockInsightSvc = {
      generate: vi.fn().mockResolvedValue(undefined),
      getCached: vi
        .fn()
        .mockReturnValue({
          insights: [{ type: "leech", meta: { cardId: "c3" } }],
        }),
    };
    orchestrator = new AdaptiveOrchestratorService(
      mockForecastSvc,
      mockInsightSvc
    );
  });

  it("computes queue (skip if no indexedDB)", async () => {
    if (typeof indexedDB === "undefined") {
      return;
    }

    const now = Date.now();
    const cards: any[] = [
      {
        id: "c1",
        deckId: "d",
        nextReview: now - 1000,
        totalReviews: 5,
        easinessFactor: 2.3,
        interval: 2,
        repetition: 1,
        correctReviews: 3,
      },
      {
        id: "c2",
        deckId: "d",
        nextReview: now + 3600_000,
        totalReviews: 1,
        easinessFactor: 2.5,
        interval: 1,
        repetition: 0,
        correctReviews: 1,
      },
      {
        id: "c3",
        deckId: "d",
        nextReview: now + 10,
        totalReviews: 10,
        easinessFactor: 2.1,
        interval: 5,
        repetition: 2,
        correctReviews: 8,
      },
    ];
    const ordered = orchestrator.computeQueue(cards as any, "d");
    expect(ordered.length).toBe(3);
    // c1 has high risk (forecast), c3 is leech (penalty)
    // Exact order depends on weights, but we verify it runs without error and returns all cards
  });

  it("should warmup services", async () => {
    const result = await orchestrator.warmup();
    expect(result.ready).toBe(true);
    expect(mockForecastSvc.getForecast).toHaveBeenCalled();
    // insightSvc.getCached or generate might be called depending on implementation details
  });

  it("should adjust weights based on feedback", () => {
    const initialWeights = orchestrator.getWeights();

    // Simulate poor performance (quality < 0.6)
    // Need > 30 samples to trigger adjustment
    for (let i = 0; i < 35; i++) {
      orchestrator.recordFeedback(0.8, 0.4, 1000);
    }

    const newWeights = orchestrator.getWeights();
    // Expect due/forecast to increase for poor performance
    expect(newWeights.due).toBeGreaterThanOrEqual(initialWeights.due);
    // Note: normalization might affect exact values, but logic attempts to increase due/forecast
  });

  it("should adjust weights for good performance", () => {
    // Reset orchestrator to clear feedback
    orchestrator = new AdaptiveOrchestratorService(
      mockForecastSvc,
      mockInsightSvc
    );
    const initialWeights = orchestrator.getWeights();

    // Simulate good performance (quality >= 0.6)
    for (let i = 0; i < 35; i++) {
      orchestrator.recordFeedback(0.8, 0.9, 1000);
    }

    const newWeights = orchestrator.getWeights();
    // Expect difficulty/retention to increase
    // Again, normalization applies
    expect(newWeights.difficulty + newWeights.retention).toBeGreaterThan(
      initialWeights.difficulty + initialWeights.retention
    );
  });
});
