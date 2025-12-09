import { describe, it, expect, beforeEach, vi } from "vitest";
import { CircadianSchedulerService } from "../../application/services/circadianScheduler/CircadianSchedulerService";

describe("CircadianSchedulerService", () => {
  let service: CircadianSchedulerService;

  beforeEach(() => {
    service = new CircadianSchedulerService();
  });

  describe("initializeProfile", () => {
    it("should create a default profile", async () => {
      const profile = await service.initializeProfile("user-1");

      expect(profile.userId).toBe("user-1");
      expect(profile.chronotype).toBe("intermediate");
      expect(profile.hourlyPerformance.size).toBe(24);
      expect(profile.peakHours.length).toBeGreaterThan(0);
      expect(profile.lowHours.length).toBeGreaterThan(0);
    });
  });

  describe("recordStudySession", () => {
    it("should update profile stats", async () => {
      const profile = await service.initializeProfile("user-1");
      const hour = 10;
      const now = new Date();
      now.setHours(hour, 0, 0, 0);

      const updatedProfile = await service.recordStudySession(
        profile,
        10, // reviewCount
        8, // correctCount (80% accuracy)
        2000, // avg response time
        now.getTime()
      );

      const stats = updatedProfile.hourlyPerformance.get(hour);
      expect(stats).toBeDefined();
      expect(stats!.reviewCount).toBe(10);
      expect(stats!.correctCount).toBe(8);
      expect(stats!.accuracyRate).toBe(0.8);
      expect(stats!.averageResponseTime).toBe(600);
      expect(updatedProfile.totalDataPoints).toBe(10);
    });
  });

  describe("getStudyRecommendation", () => {
    it("should provide recommendations based on current time", async () => {
      const profile = await service.initializeProfile("user-1");

      // Mock current time to 10 AM (peak hour)
      vi.useFakeTimers();
      const now = new Date();
      now.setHours(10, 0, 0, 0);
      vi.setSystemTime(now);

      const recommendation = await service.getStudyRecommendation(profile);

      expect(recommendation.currentHour).toBe(10);
      expect(recommendation.shouldStudyNow).toBe(true); // Assuming 10 AM is peak in default profile
      expect(recommendation.difficulty).toBeDefined();
      expect(recommendation.optimalDuration).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it("should suggest better time if current time is low energy", async () => {
      const profile = await service.initializeProfile("user-1");

      // Mock current time to 3 AM (low hour)
      vi.useFakeTimers();
      const now = new Date();
      now.setHours(3, 0, 0, 0);
      vi.setSystemTime(now);

      const recommendation = await service.getStudyRecommendation(profile);

      expect(recommendation.currentHour).toBe(3);
      expect(recommendation.shouldStudyNow).toBe(false); // Assuming 3 AM is low in default profile
      expect(recommendation.recommendedHour).not.toBe(3);

      vi.useRealTimers();
    });
  });

  describe("export/import", () => {
    it("should serialize and deserialize profile correctly", async () => {
      const profile = await service.initializeProfile("user-1");
      const exported = await service.exportProfile(profile);

      expect(Array.isArray(exported.hourlyPerformance)).toBe(true);

      const imported = await service.importProfile(exported);
      expect(imported.userId).toBe(profile.userId);
      expect(imported.hourlyPerformance).toBeInstanceOf(Map);
      expect(imported.hourlyPerformance.size).toBe(24);
    });
  });
});
