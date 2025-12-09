import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InsightService } from "../../application/services/InsightService";
import { eventBus } from "../../core/events/EventBus";

vi.mock("../../utils/performanceOptimizer", () => ({
  PerformanceOptimizer: {
    yieldToMain: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../core/events/EventBus", () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

describe("InsightService", () => {
  let service: InsightService;
  let mockCardRepo: any;
  let mockSessionRepo: any;
  let mockCards: any[];
  let mockSessions: any[];

  beforeEach(() => {
    mockCards = [];
    mockSessions = [];
    mockCardRepo = {
      getAll: vi.fn().mockImplementation(async () => mockCards),
    };
    mockSessionRepo = {
      getRecent: vi.fn().mockImplementation(async () => mockSessions),
    };

    service = new InsightService(
      () => mockCardRepo,
      () => mockSessionRepo
    );

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return cached snapshot if valid", async () => {
    const result1 = await service.generate();
    expect(mockCardRepo.getAll).toHaveBeenCalledTimes(1);

    const result2 = await service.generate();
    expect(mockCardRepo.getAll).toHaveBeenCalledTimes(1);
    expect(result2).toBe(result1);

    // Expire cache
    vi.setSystemTime(new Date(Date.now() + 31000));

    await service.generate();
    expect(mockCardRepo.getAll).toHaveBeenCalledTimes(2);
  });

  it("should detect leeches", async () => {
    mockCards = [
      { id: "leech", totalReviews: 10, correctReviews: 2, repetition: 1 }, // 20% success
      { id: "good", totalReviews: 10, correctReviews: 9, repetition: 5 },
    ];

    const result = await service.generate(true);
    const leech = result.insights.find((i) => i.type === "leech");

    expect(leech).toBeDefined();
    expect(leech?.meta?.cardId).toBe("leech");
    expect(leech?.severity).toBe("critical");
  });

  it("should detect due surge", async () => {
    const now = Date.now();
    // 5 cards, 3 due within 24h (60%)
    mockCards = [
      { id: "1", nextReview: now + 3600000 },
      { id: "2", nextReview: now + 3600000 },
      { id: "3", nextReview: now + 3600000 },
      { id: "4", nextReview: now + 86400000 * 2 },
      { id: "5", nextReview: now + 86400000 * 2 },
    ];

    const result = await service.generate(true);
    const surge = result.insights.find((i) => i.type === "due_surge");

    expect(surge).toBeDefined();
    expect(surge?.meta?.dueNext24).toBe(3);
  });

  it("should detect stagnation", async () => {
    const now = Date.now();
    mockSessions = [
      { startTime: now - 86400000 * 3 }, // 3 days ago
    ];

    const result = await service.generate(true);
    const stagnation = result.insights.find((i) => i.type === "stagnation");

    expect(stagnation).toBeDefined();
  });

  it("should detect slow responses", async () => {
    const now = Date.now();
    mockSessions = [
      { startTime: now, averageResponseTime: 10000 },
      { startTime: now, averageResponseTime: 9500 },
      { startTime: now, averageResponseTime: 9000 },
    ];

    const result = await service.generate(true);
    const slow = result.insights.find((i) => i.type === "slow_response");

    expect(slow).toBeDefined();
    expect(slow?.severity).toBe("critical");
  });

  it("should detect neglected tags", async () => {
    mockCards = [
      { id: "1", tags: ["math"] },
      { id: "2", tags: ["math"] },
      { id: "3", tags: ["math"] },
      { id: "4", tags: ["math"] },
      { id: "5", tags: ["math"] }, // 5 math cards
      { id: "6", tags: ["history"] },
    ];

    // Only history studied recently
    mockSessions = [{ cardIds: ["6"] }];

    const result = await service.generate(true);
    const gap = result.insights.find((i) => i.type === "tag_gap");

    expect(gap).toBeDefined();
    expect(gap?.meta?.t).toBe("math");
  });

  it("should publish event on generation", async () => {
    await service.generate(true);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "insights.generated",
      })
    );
  });

  it("should manage cache manually", () => {
    service.resetCache();
    expect(service.getCached()).toBeNull();
  });
});
