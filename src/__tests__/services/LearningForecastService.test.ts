import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LearningForecastService } from "../../application/services/LearningForecastService";

describe("LearningForecastService", () => {
  let service: LearningForecastService;
  let mockRepo: any;
  let mockCards: any[];

  beforeEach(() => {
    mockCards = [];
    mockRepo = {
      getAll: vi.fn().mockImplementation(async () => mockCards),
    };
    service = new LearningForecastService(mockRepo);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return cached snapshot if valid", async () => {
    mockCards = [
      {
        id: "1",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: Date.now(),
        nextReview: Date.now(),
      },
    ];

    // First call
    const result1 = await service.getForecast();
    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);

    // Second call (cached)
    const result2 = await service.getForecast();
    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
    expect(result2).toBe(result1);

    // Advance time past TTL (60s)
    vi.setSystemTime(new Date(Date.now() + 61000));

    // Third call (expired)
    await service.getForecast();
    expect(mockRepo.getAll).toHaveBeenCalledTimes(2);
  });

  it("should force refresh if requested", async () => {
    mockCards = [
      {
        id: "1",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: Date.now(),
        nextReview: Date.now(),
      },
    ];

    await service.getForecast();
    await service.getForecast(true);

    expect(mockRepo.getAll).toHaveBeenCalledTimes(2);
  });

  it("should calculate risk correctly", async () => {
    const now = Date.now();
    mockCards = [
      {
        id: "high-risk",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: now - 86400000 * 2, // 2 days ago, interval 1 day -> overdue
        nextReview: now - 86400000,
        totalReviews: 10,
        correctReviews: 5, // 50% accuracy
      },
      {
        id: "low-risk",
        interval: 10,
        easinessFactor: 2.5,
        lastReview: now, // Just reviewed
        nextReview: now + 86400000 * 10,
        totalReviews: 10,
        correctReviews: 10, // 100% accuracy
      },
    ];

    const result = await service.getForecast(true);

    const highRisk = result.items.find((i) => i.cardId === "high-risk");
    const lowRisk = result.items.find((i) => i.cardId === "low-risk");

    expect(highRisk).toBeDefined();
    // Low risk card is due in 10 days, horizon is 48h (2 days). So it should NOT be in the list.
    expect(lowRisk).toBeUndefined();

    expect(highRisk?.risk).toBeGreaterThan(0.5);
  });

  it("should include cards due within horizon", async () => {
    const now = Date.now();
    mockCards = [
      {
        id: "due-soon",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: now - 86400000,
        nextReview: now + 3600000, // Due in 1 hour
      },
      {
        id: "due-later",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: now - 86400000,
        nextReview: now + 86400000 * 3, // Due in 3 days (outside 48h horizon)
      },
    ];

    const result = await service.getForecast(true);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.cardId).toBe("due-soon");
  });

  it("should handle errors gracefully", async () => {
    mockCards = [
      { id: "valid" }, // Missing properties, might throw in calculation
      {
        id: "error",
        get interval() {
          throw new Error("Access error");
        },
      },
    ];

    const result = await service.getForecast(true);
    // Should not crash, maybe process valid ones or skip
    // The code catches errors inside the loop
    expect(result).toBeDefined();
  });

  it("should clear snapshot", async () => {
    mockCards = [{ id: "1" }];
    await service.getForecast();
    expect(mockRepo.getAll).toHaveBeenCalledTimes(1);

    service.clearSnapshot();
    await service.getForecast();
    expect(mockRepo.getAll).toHaveBeenCalledTimes(2);
  });

  it("should sort by risk descending", async () => {
    const now = Date.now();
    mockCards = [
      {
        id: "medium",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: now - 86400000 * 1.5,
        nextReview: now,
        totalReviews: 10,
        correctReviews: 8,
      },
      {
        id: "high",
        interval: 1,
        easinessFactor: 2.5,
        lastReview: now - 86400000 * 5, // Very overdue
        nextReview: now,
        totalReviews: 10,
        correctReviews: 5,
      },
    ];

    const result = await service.getForecast(true);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.cardId).toBe("high");
    expect(result.items[1]?.cardId).toBe("medium");
    expect(result.items[0]?.risk).toBeGreaterThan(result.items[1]?.risk || 0);
  });
});
