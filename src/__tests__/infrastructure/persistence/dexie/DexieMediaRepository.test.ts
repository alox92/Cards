import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { DexieMediaRepository } from "../../../../infrastructure/persistence/dexie/DexieMediaRepository";
import {
  aribaDB,
  MediaRow,
} from "../../../../infrastructure/persistence/dexie/AribaDB";

describe("DexieMediaRepository", () => {
  let repo: DexieMediaRepository;
  let mockStore: Map<string, MediaRow>;

  beforeEach(async () => {
    repo = new DexieMediaRepository({ enableDedup: true });
    mockStore = new Map();

    // Mock Dexie table methods
    vi.spyOn(aribaDB.media, "put").mockImplementation((async (
      row: MediaRow
    ) => {
      mockStore.set(row.id, row);
      return row.id;
    }) as any);

    vi.spyOn(aribaDB.media, "get").mockImplementation((async (id: string) => {
      return mockStore.get(id);
    }) as any);

    vi.spyOn(aribaDB.media, "delete").mockImplementation((async (
      id: string
    ) => {
      mockStore.delete(id);
    }) as any);

    vi.spyOn(aribaDB.media, "where").mockImplementation(((index: string) => {
      return {
        equals: (value: any) => ({
          first: async () => {
            for (const row of mockStore.values()) {
              if ((row as any)[index] === value) return row;
            }
            return undefined;
          },
        }),
      } as any;
    }) as any);

    vi.spyOn(aribaDB.media, "count").mockImplementation((async () => {
      return mockStore.size;
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should save and retrieve media", async () => {
    const blob = new Blob(["test content"], { type: "text/plain" });
    const saved = await repo.save(blob, "image", "text/plain");

    expect(saved.id).toBeDefined();

    const retrieved = await repo.get(saved.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.mime).toBe("text/plain");

    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(retrieved?.blob as Blob);
    });
    expect(text).toBe("test content");
  });

  it("should deduplicate identical media if enabled", async () => {
    const blob1 = new Blob(["duplicate content"], { type: "text/plain" });
    const blob2 = new Blob(["duplicate content"], { type: "text/plain" });

    const saved1 = await repo.save(blob1, "image", "text/plain");
    const saved2 = await repo.save(blob2, "image", "text/plain");

    expect(saved1.id).toBe(saved2.id);
    expect(mockStore.size).toBe(1);
  });

  it("should not deduplicate different media", async () => {
    const blob1 = new Blob(["content 1"], { type: "text/plain" });
    const blob2 = new Blob(["content 2"], { type: "text/plain" });

    const saved1 = await repo.save(blob1, "image", "text/plain");
    const saved2 = await repo.save(blob2, "image", "text/plain");

    expect(saved1.id).not.toBe(saved2.id);
    expect(mockStore.size).toBe(2);
  });

  it("should delete media", async () => {
    const blob = new Blob(["to delete"], { type: "text/plain" });
    const saved = await repo.save(blob, "image", "text/plain");

    await repo.delete(saved.id);
    const retrieved = await repo.get(saved.id);
    expect(retrieved).toBeUndefined();
  });
});
