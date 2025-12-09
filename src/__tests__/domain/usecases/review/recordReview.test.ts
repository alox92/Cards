import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordReview } from "../../../../domain/usecases/review/recordReview";
import { eventBus } from "../../../../core/events/EventBus";

vi.mock("../../../../core/events/EventBus", () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

describe("recordReview", () => {
  const mockGetCard = vi.fn();
  const mockUpdateCard = vi.fn();
  const deps = {
    getCard: mockGetCard,
    updateCard: mockUpdateCard,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update card with SM2 algorithm results", async () => {
    const card = {
      id: "c1",
      deckId: "d1",
      easinessFactor: 2.5,
      interval: 0,
      repetition: 0,
      lastReview: 1000,
      nextReview: 1000,
      totalReviews: 0,
      correctReviews: 0,
    };
    mockGetCard.mockResolvedValue(card);

    await recordReview(deps, { cardId: "c1", quality: 5 });

    expect(mockGetCard).toHaveBeenCalledWith("c1");
    expect(mockUpdateCard).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        repetition: 1,
        totalReviews: 1,
        correctReviews: 1,
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "card.reviewed",
        payload: expect.objectContaining({
          cardId: "c1",
          quality: 5,
        }),
      })
    );
  });

  it("should reset repetition and interval on low quality", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));

    const card = {
      id: "c1",
      deckId: "d1",
      easinessFactor: 2,
      interval: 10,
      repetition: 3,
      lastReview: 0,
      nextReview: 0,
      totalReviews: 5,
      correctReviews: 4,
    };
    mockGetCard.mockResolvedValue(card);

    await recordReview(deps, { cardId: "c1", quality: 1 });

    expect(mockUpdateCard).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        repetition: 0,
        interval: 1,
        lastReview: Date.now(),
        nextReview: Date.now() + 86400000,
        totalReviews: 6,
        correctReviews: 4,
      })
    );

    vi.useRealTimers();
  });

  it("should clamp easiness factor and compute next review on high quality", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));

    const card = {
      id: "c1",
      deckId: "d1",
      easinessFactor: 2.5,
      interval: 6,
      repetition: 2,
      lastReview: 0,
      nextReview: 0,
      totalReviews: 3,
      correctReviews: 3,
    };
    mockGetCard.mockResolvedValue(card);

    await recordReview(deps, { cardId: "c1", quality: 5 });

    // EF should be clamped to max 2.5; interval should grow accordingly
    const expectedInterval = Math.round(6 * 2.5); // 15
    const expectedNextReview = Date.now() + expectedInterval * 86400000;

    expect(mockUpdateCard).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        easinessFactor: 2.5,
        interval: expectedInterval,
        repetition: 3,
        nextReview: expectedNextReview,
        totalReviews: 4,
        correctReviews: 4,
      })
    );

    vi.useRealTimers();
  });

  it("should throw error if card not found", async () => {
    mockGetCard.mockResolvedValue(null);

    await expect(
      recordReview(deps, { cardId: "c1", quality: 5 })
    ).rejects.toThrow("Card not found");
  });
});
