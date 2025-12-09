import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { HeatmapStatsService } from "../../application/services/HeatmapStatsService";

// Mock WorkerPool
vi.mock("../../workers/WorkerPool", () => {
  return {
    WorkerPool: vi.fn().mockImplementation(() => ({
      run: vi.fn(),
      terminate: vi.fn(),
    })),
  };
});

// Mock worker import
vi.mock("../../workers/heatmapStatsWorker?worker", () => {
  return {
    default: vi.fn(),
  };
});

describe("HeatmapStatsService", () => {
  let service: HeatmapStatsService;
  let mockRepo: any;
  let mockSessions: any[];

  beforeEach(() => {
    mockSessions = [];
    mockRepo = {
      getRecent: vi.fn().mockImplementation(async () => mockSessions),
    };
    service = new HeatmapStatsService(mockRepo);

    // Mock Date to ensure consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return empty heatmap if no sessions", async () => {
    const result = await service.getLastNDays(5);
    expect(result).toHaveLength(5);
    expect(result.every((d) => d.reviews === 0)).toBe(true);
    // Check dates are correct (reverse order)
    expect(result[4]?.date).toBe("2023-01-01");
    expect(result[0]?.date).toBe("2022-12-28");
  });

  it("should calculate reviews correctly (sequential)", async () => {
    mockSessions = [
      {
        startTime: new Date("2023-01-01T10:00:00Z").getTime(),
        cardsStudied: 10,
      },
      {
        startTime: new Date("2023-01-01T14:00:00Z").getTime(),
        cardsStudied: 5,
      },
      {
        startTime: new Date("2022-12-31T10:00:00Z").getTime(),
        cardsStudied: 20,
      },
    ];

    const result = await service.getLastNDays(3);

    // 2022-12-30: 0
    // 2022-12-31: 20
    // 2023-01-01: 15

    expect(result).toHaveLength(3);
    expect(result.find((d) => d.date === "2023-01-01")?.reviews).toBe(15);
    expect(result.find((d) => d.date === "2022-12-31")?.reviews).toBe(20);
    expect(result.find((d) => d.date === "2022-12-30")?.reviews).toBe(0);
  });

  it("should use worker pool for large datasets", async () => {
    // Create > 500 sessions
    mockSessions = Array(600)
      .fill(0)
      .map(() => ({
        startTime: new Date("2023-01-01T10:00:00Z").getTime(),
        cardsStudied: 1,
      }));

    // Mock navigator.hardwareConcurrency
    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 4,
      configurable: true,
    });

    // Import WorkerPool mock to configure return value
    const { WorkerPool } = await import("../../workers/WorkerPool");
    const mockRun = vi.fn().mockResolvedValue({
      map: { "2023-01-01": 600 },
    });

    (WorkerPool as any).mockImplementation(() => ({
      run: mockRun,
      terminate: vi.fn(),
    }));

    const result = await service.getLastNDays(1);

    expect(WorkerPool).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();
    expect(result[0]?.reviews).toBe(2400);
  });

  it("should fallback to sequential if worker fails", async () => {
    mockSessions = Array(600)
      .fill(0)
      .map(() => ({
        startTime: new Date("2023-01-01T10:00:00Z").getTime(),
        cardsStudied: 1,
      }));

    Object.defineProperty(global.navigator, "hardwareConcurrency", {
      value: 4,
      configurable: true,
    });

    const { WorkerPool } = await import("../../workers/WorkerPool");
    (WorkerPool as any).mockImplementation(() => {
      throw new Error("Worker init failed");
    });

    const result = await service.getLastNDays(1);

    // Should still work via fallback
    expect(result[0]?.reviews).toBe(600);
  });
});
