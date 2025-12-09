import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchIndexService } from "@/application/services/SearchIndexService";
import { aribaDB } from "@/infrastructure/persistence/dexie/AribaDB";

// Mock aribaDB
vi.mock("@/infrastructure/persistence/dexie/AribaDB", () => ({
  aribaDB: {
    table: vi.fn(),
    searchIndex: {
      clear: vi.fn(),
      bulkAdd: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
    },
    searchTrigrams: {
      clear: vi.fn(),
      bulkAdd: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
    },
    searchTermStats: {
      clear: vi.fn(),
      bulkAdd: vi.fn(),
      add: vi.fn(),
      where: vi.fn(),
    },
  },
}));

// Mock WorkerPool
vi.mock("@/workers/WorkerPool", () => ({
  WorkerPool: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ entries: [] }),
    terminate: vi.fn(),
  })),
}));

describe("SearchIndexService", () => {
  let service: SearchIndexService;
  let mockCardRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCardRepo = {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
    };

    // Setup table mock
    (aribaDB.table as any).mockImplementation((name: string) => {
      if (name === "searchIndex") return (aribaDB as any).searchIndex;
      if (name === "searchTrigrams") return (aribaDB as any).searchTrigrams;
      return {};
    });

    service = new SearchIndexService(mockCardRepo);
  });

  it("should rebuild index sequentially for small datasets", async () => {
    const cards = [{ id: "c1", frontText: "Hello", backText: "World" }];
    mockCardRepo.getAll.mockResolvedValue(cards);

    const result = await service.rebuildAll();

    expect(result.parallel).toBe(false);
    expect((aribaDB as any).searchIndex.bulkAdd).toHaveBeenCalled();
    expect((aribaDB as any).searchTrigrams.bulkAdd).toHaveBeenCalled();
  });

  it("should index a single card", async () => {
    const card = { id: "c1", frontText: "Hello", backText: "World" };

    const mockWhere = {
      equals: vi.fn().mockReturnValue({
        delete: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (aribaDB as any).searchIndex.where.mockReturnValue(mockWhere);
    (aribaDB as any).searchTrigrams.where.mockReturnValue(mockWhere);

    await service.indexCard(card as any);

    expect((aribaDB as any).searchIndex.bulkAdd).toHaveBeenCalled(); // Changed from add to bulkAdd
    expect((aribaDB as any).searchTrigrams.bulkAdd).toHaveBeenCalled(); // Changed from add to bulkAdd
  });

  it("should handle concurrent rebuilds", async () => {
    mockCardRepo.getAll.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return [];
    });

    const p1 = service.rebuildAll();
    const p2 = service.rebuildAll();

    // expect(p1).toBe(p2); // Removed because async function returns new promise wrapper
    await Promise.all([p1, p2]);
    expect(mockCardRepo.getAll).toHaveBeenCalledTimes(1);
  });
});
