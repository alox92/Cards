import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCards } from "@/ui/hooks/useCards";
import { container } from "@/application/Container";

// Mock container
vi.mock("@/application/Container", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

describe("useCards", () => {
  const mockCardService = {
    listByDeck: vi.fn(),
    listAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (container.resolve as any).mockReturnValue(mockCardService);
  });

  it("should load cards on mount if autoLoad is true", async () => {
    const mockCards = [{ id: "1", front: "F", back: "B" }];
    mockCardService.listAll.mockResolvedValue(mockCards);

    const { result } = renderHook(() => useCards({ autoLoad: true }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cards).toEqual(mockCards);
    expect(mockCardService.listAll).toHaveBeenCalled();
  });

  it("should filter by deckId", async () => {
    const mockCards = [{ id: "1", deckId: "d1" }];
    mockCardService.listByDeck.mockResolvedValue(mockCards);

    const { result } = renderHook(() =>
      useCards({ deckId: "d1", autoLoad: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockCardService.listByDeck).toHaveBeenCalledWith("d1");
    expect(result.current.cards).toEqual(mockCards);
  });

  it("should handle errors", async () => {
    mockCardService.listAll.mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useCards({ autoLoad: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Fetch failed");
    expect(result.current.cards).toEqual([]);
  });

  it("should create a card", async () => {
    const newCard = { id: "2", front: "New", back: "Card", deckId: "d1" };
    mockCardService.create.mockResolvedValue(newCard);
    mockCardService.listAll.mockResolvedValue([]);

    const { result } = renderHook(() => useCards({ autoLoad: false }));

    await act(async () => {
      const created = await result.current.create({
        front: "New",
        back: "Card",
        deckId: "d1",
      } as any);
      expect(created).toEqual(newCard);
    });

    expect(mockCardService.create).toHaveBeenCalledWith(
      "d1",
      expect.objectContaining({ front: "New" })
    );
    expect(result.current.cards).toContainEqual(newCard);
  });

  it("should update a card", async () => {
    const initialCard = { id: "1", front: "Old" };
    const updatedCard = { id: "1", front: "New" };

    // Setup initial state
    mockCardService.listAll.mockResolvedValue([initialCard]);
    const { result } = renderHook(() => useCards({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockCardService.update.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.update(updatedCard as any);
    });

    expect(mockCardService.update).toHaveBeenCalledWith(updatedCard);
    expect(result.current.cards[0]).toEqual(updatedCard);
  });

  it("should remove a card", async () => {
    const initialCard = { id: "1", front: "Delete Me" };

    mockCardService.listAll.mockResolvedValue([initialCard]);
    const { result } = renderHook(() => useCards({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockCardService.delete.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.remove("1");
    });

    expect(mockCardService.delete).toHaveBeenCalledWith("1");
    expect(result.current.cards).toHaveLength(0);
  });
});
