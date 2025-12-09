import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgendaScheduler } from "../../application/services/AgendaScheduler";
import { CardEntity } from "../../domain/entities/Card";

describe("AgendaScheduler", () => {
  let service: AgendaScheduler;
  let mockCardRepo: any;

  beforeEach(() => {
    mockCardRepo = {
      getAll: vi.fn(),
    };
    service = new AgendaScheduler(mockCardRepo);
  });

  it("should generate yearly heatmap correctly", async () => {
    const now = new Date("2024-01-01T12:00:00Z").getTime();
    const tomorrow = new Date("2024-01-02T12:00:00Z").getTime();

    const cards = [
      { nextReview: now } as CardEntity,
      { nextReview: now } as CardEntity,
      { nextReview: tomorrow } as CardEntity,
    ];

    mockCardRepo.getAll.mockResolvedValue(cards);

    const result = await service.yearlyHeatmap();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ day: "2024-01-01", due: 2 });
    expect(result[1]).toEqual({ day: "2024-01-02", due: 1 });
  });

  it("should handle empty repository", async () => {
    mockCardRepo.getAll.mockResolvedValue([]);
    const result = await service.yearlyHeatmap();
    expect(result).toHaveLength(0);
  });
});
