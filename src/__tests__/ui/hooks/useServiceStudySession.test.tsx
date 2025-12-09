import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useServiceStudySession } from "@/ui/hooks/useServiceStudySession";
import { container } from "@/application/Container";

// Mock container
vi.mock("@/application/Container", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

describe("useServiceStudySession", () => {
  const mockService = {
    buildQueue: vi.fn(),
    recordAnswer: vi.fn(),
    endSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (container.resolve as any).mockReturnValue(mockService);
  });

  it("should build queue on mount if deckId is provided", async () => {
    const mockQueue = [{ id: "1", front: "F" }];
    mockService.buildQueue.mockResolvedValue(mockQueue);

    const { result } = renderHook(() =>
      useServiceStudySession({ deckId: "d1" })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockService.buildQueue).toHaveBeenCalledWith(
      "d1",
      expect.any(Number)
    );
    expect(result.current.currentCard).toEqual(mockQueue[0]);
    expect(result.current.remaining).toBe(1);
  });

  it("should handle empty queue", async () => {
    mockService.buildQueue.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useServiceStudySession({ deckId: "d1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // finished is only set to true when completing a session via answer()
    // or if we explicitly handle empty queue in buildQueue (which we don't seem to do)
    expect(result.current.finished).toBe(false);
    expect(result.current.currentCard).toBeNull();
  });

  it("should record answer and advance queue", async () => {
    const card1 = { id: "1", front: "F1" };
    const card2 = { id: "2", front: "F2" };
    mockService.buildQueue.mockResolvedValue([card1, card2]);
    mockService.recordAnswer.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useServiceStudySession({ deckId: "d1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentCard).toEqual(card1);

    await act(async () => {
      await result.current.answer(5);
    });

    // The hook calls recordAnswer(card, quality, duration)
    expect(mockService.recordAnswer).toHaveBeenCalledWith(
      card1,
      5,
      expect.any(Number)
    );

    expect(result.current.currentCard).toEqual(card2);
    expect(result.current.remaining).toBe(1);
  });

  it("should finish session when queue is empty", async () => {
    const card1 = { id: "1", front: "F1" };
    mockService.buildQueue.mockResolvedValue([card1]);
    mockService.recordAnswer.mockResolvedValue(undefined);
    mockService.endSession.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useServiceStudySession({ deckId: "d1" })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.answer(5);
    });

    expect(result.current.finished).toBe(true);
    expect(result.current.currentCard).toBeNull();
    expect(mockService.endSession).toHaveBeenCalled();
  });
});
