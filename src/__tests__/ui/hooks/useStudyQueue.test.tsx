import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useStudyQueue } from "@/ui/hooks/useStudyQueue";
import { container } from "@/application/Container";

// Mock container
vi.mock("@/application/Container", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

// Mock concurrent transition
vi.mock("@/utils/reactConcurrentFeatures", () => {
  const executeTransition = (cb: any) => cb();
  return {
    useConcurrentTransition: () => ({
      executeTransition,
    }),
  };
});

// Mock web worker manager
vi.mock("@/utils/webWorkerManager", () => ({
  webWorkerManager: {
    executeTask: vi.fn(),
  },
}));

describe("useStudyQueue", () => {
  const mockService = {
    buildQueue: vi.fn(),
    recordAnswer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (container.resolve as any).mockReturnValue(mockService);
  });

  it("should build queue on mount", async () => {
    const mockQueue = [{ id: "1", front: "F" }];
    mockService.buildQueue.mockResolvedValue(mockQueue);

    const { result } = renderHook(() =>
      useStudyQueue({ deckId: "d1", dailyNewLimit: 10 })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockService.buildQueue).toHaveBeenCalledWith("d1", 10);
    expect(result.current.queue).toEqual(mockQueue);
  });

  it("should record answer and update queue", async () => {
    const card1 = { id: "1", front: "F1" };
    const card2 = { id: "2", front: "F2" };
    mockService.buildQueue.mockResolvedValue([card1, card2]);
    mockService.recordAnswer.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useStudyQueue({ deckId: "d1", dailyNewLimit: 10 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.record(card1 as any, 5, 1000);
    });

    expect(mockService.recordAnswer).toHaveBeenCalledWith(card1, 5, 1000);

    // The hook updates queue by filtering out the card
    expect(result.current.queue).toEqual([card2]);
  });
});
