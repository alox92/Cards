import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LeaderboardService } from "../../application/services/leaderboard/LeaderboardService";

describe("LeaderboardService", () => {
  let service: LeaderboardService;
  let fetchMock: any;

  beforeEach(() => {
    service = new LeaderboardService();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize correctly", () => {
    expect(service.isReady()).toBe(true);
  });

  describe("Mock Mode", () => {
    beforeEach(() => {
      service.setMockMode(true);
    });

    it("should return mock leaderboard", async () => {
      const result = await service.getLeaderboard({
        type: "global",
        timeframe: "all-time",
        metric: "xp",
        limit: 10,
      });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].rank).toBe(1);
    });

    it("should return mock user stats", async () => {
      const result = await service.getUserStats("user-1");
      expect(result.totalXP).toBeGreaterThan(0);
    });

    it("should return mock achievements", async () => {
      const result = await service.getAchievements("user-1");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should mock update score", async () => {
      const result = await service.updateScore("user-1", 100, 10, 90);
      expect(result).toBe(true);
    });

    it("should mock unlock achievement", async () => {
      const result = await service.unlockAchievement("user-1", "ach-1");
      expect(result).toBe(true);
    });

    it("should mock search users", async () => {
      const result = await service.searchUsers("Alex");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].username).toContain("Alex");
    });

    it("should mock add friend", async () => {
      const result = await service.addFriend("user-1", "user-2");
      expect(result).toBe(true);
    });

    it("should mock get friends", async () => {
      const result = await service.getFriends("user-1");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("API Mode", () => {
    beforeEach(() => {
      service.setMockMode(false);
    });

    it("should call API for leaderboard", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [] }),
      });

      await service.getLeaderboard({
        type: "global",
        timeframe: "all-time",
        metric: "xp",
        limit: 10,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/leaderboard"),
        expect.any(Object)
      );
    });

    it("should handle API error for leaderboard", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(
        service.getLeaderboard({
          type: "global",
          timeframe: "all-time",
          metric: "xp",
          limit: 10,
        })
      ).rejects.toThrow("Erreur API: 500");
    });

    it("should call API for user stats", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ totalXP: 100 }),
      });

      await service.getUserStats("user-1");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/stats"),
        expect.any(Object)
      );
    });

    it("should call API for update score", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      await service.updateScore("user-1", 100, 10, 90);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/score"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call API for achievements", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ achievements: [] }),
      });

      await service.getAchievements("user-1");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/achievements"),
        expect.any(Object)
      );
    });

    it("should call API for unlock achievement", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      await service.unlockAchievement("user-1", "ach-1");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/achievements/ach-1/unlock"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call API for search users", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      });

      await service.searchUsers("query");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/search"),
        expect.any(Object)
      );
    });

    it("should call API for add friend", async () => {
      fetchMock.mockResolvedValue({ ok: true });

      await service.addFriend("user-1", "user-2");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/friends"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call API for get friends", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ friends: [] }),
      });

      await service.getFriends("user-1");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/users/user-1/friends"),
        expect.any(Object)
      );
    });

    it("should include auth token if available", async () => {
      vi.spyOn(localStorage, "getItem").mockReturnValue("fake-token");
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [] }),
      });

      await service.getLeaderboard({
        type: "global",
        timeframe: "all-time",
        metric: "xp",
        limit: 10,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
        })
      );
    });
  });

  it("should dispose correctly", () => {
    service.dispose();
    expect(service.isReady()).toBe(false);
  });
});
