import { describe, it, expect, beforeEach, vi } from "vitest";
import { MediaService } from "../../application/services/MediaService";
import { DexieMediaRepository } from "../../infrastructure/persistence/dexie/DexieMediaRepository";

// Mock DexieMediaRepository
vi.mock("../../infrastructure/persistence/dexie/DexieMediaRepository", () => ({
  DexieMediaRepository: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
    get: vi.fn(),
  })),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:url");

describe("MediaService", () => {
  let service: MediaService;
  let mockRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = new DexieMediaRepository();
    service = new MediaService(mockRepo);
  });

  it("should save image", async () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    mockRepo.save.mockResolvedValue("media-id");

    const result = await service.saveImage(file);

    expect(result).toBe("media-id");
    expect(mockRepo.save).toHaveBeenCalledWith(file, "image", "image/png");
  });

  it("should save audio", async () => {
    const file = new File(["content"], "test.mp3", { type: "audio/mpeg" });
    mockRepo.save.mockResolvedValue("media-id");

    const result = await service.saveAudio(file);

    expect(result).toBe("media-id");
    expect(mockRepo.save).toHaveBeenCalledWith(file, "audio", "audio/mpeg");
  });

  it("should get url", async () => {
    const blob = new Blob(["content"], { type: "image/png" });
    mockRepo.get.mockResolvedValue({ blob });

    const url = await service.getUrl("media-id");

    expect(url).toBe("blob:url");
    expect(mockRepo.get).toHaveBeenCalledWith("media-id");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("should return null if media not found", async () => {
    mockRepo.get.mockResolvedValue(null);

    const url = await service.getUrl("media-id");

    expect(url).toBeNull();
  });
});
