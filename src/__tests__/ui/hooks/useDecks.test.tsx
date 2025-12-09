import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDecks } from "@/ui/hooks/useDecks";
import { container } from "@/application/Container";

// Mock container
vi.mock("@/application/Container", () => ({
  container: {
    resolve: vi.fn(),
  },
}));

describe("useDecks", () => {
  const mockDeckService = {
    listDecks: vi.fn(),
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (container.resolve as any).mockReturnValue(mockDeckService);
  });

  it("should load decks on mount if autoLoad is true", async () => {
    const mockDecks = [{ id: "1", name: "Deck 1" }];
    mockDeckService.listDecks.mockResolvedValue(mockDecks);

    const { result } = renderHook(() => useDecks({ autoLoad: true }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.decks).toEqual(mockDecks);
    expect(mockDeckService.listDecks).toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    mockDeckService.listDecks.mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useDecks({ autoLoad: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Fetch failed");
    expect(result.current.decks).toEqual([]);
  });

  it("should create a deck", async () => {
    const newDeck = { id: "2", name: "New Deck" };
    mockDeckService.createDeck.mockResolvedValue(newDeck);
    mockDeckService.listDecks.mockResolvedValue([]);

    const { result } = renderHook(() => useDecks({ autoLoad: false }));

    await act(async () => {
      const created = await result.current.create({ name: "New Deck" } as any);
      expect(created).toEqual(newDeck);
    });

    expect(mockDeckService.createDeck).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Deck" })
    );
    expect(result.current.decks).toContainEqual(newDeck);
  });

  it("should update a deck", async () => {
    const initialDeck = { id: "1", name: "Old" };
    const updatedDeck = { id: "1", name: "New" };

    mockDeckService.listDecks.mockResolvedValue([initialDeck]);
    const { result } = renderHook(() => useDecks({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockDeckService.updateDeck.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.update(updatedDeck as any);
    });

    expect(mockDeckService.updateDeck).toHaveBeenCalledWith(updatedDeck);
    expect(result.current.decks[0]).toEqual(updatedDeck);
  });

  it("should remove a deck", async () => {
    const initialDeck = { id: "1", name: "Delete Me" };

    mockDeckService.listDecks.mockResolvedValue([initialDeck]);
    const { result } = renderHook(() => useDecks({ autoLoad: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockDeckService.deleteDeck.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.remove("1");
    });

    expect(mockDeckService.deleteDeck).toHaveBeenCalledWith("1");
    expect(result.current.decks).toHaveLength(0);
  });
});
