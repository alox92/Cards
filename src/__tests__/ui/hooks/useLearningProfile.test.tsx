import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLearningProfile } from "@/ui/hooks/useLearningProfile";
import { getIntelligentLearningSystem } from "@/core/IntelligentLearningSystem";

// Mock ILS
vi.mock("@/core/IntelligentLearningSystem", () => ({
  getIntelligentLearningSystem: vi.fn(),
}));

describe("useLearningProfile", () => {
  const mockILS = {
    getLearningProfile: vi.fn(),
    getRecommendations: vi.fn(),
    generateRecommendations: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getIntelligentLearningSystem as any).mockReturnValue(mockILS);
  });

  it("should load profile and recommendations on mount", async () => {
    const mockProfile = { id: "p1" };
    const mockRecs = [{ id: "r1" }];
    mockILS.getLearningProfile.mockReturnValue(mockProfile);
    mockILS.getRecommendations.mockReturnValue(mockRecs);

    const { result } = renderHook(() => useLearningProfile());

    // Initial state might be loading or already loaded depending on timing
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.recommendations).toEqual(mockRecs);
  });

  it("should generate recommendations if empty", async () => {
    const mockProfile = { id: "p1" };
    const mockRecs = [{ id: "r1" }];
    mockILS.getLearningProfile.mockReturnValue(mockProfile);
    mockILS.getRecommendations.mockReturnValue([]);
    mockILS.generateRecommendations.mockResolvedValue(mockRecs);

    const { result } = renderHook(() => useLearningProfile());

    await waitFor(() => {
      expect(result.current.recommendations).toEqual(mockRecs);
    });

    expect(mockILS.generateRecommendations).toHaveBeenCalled();
  });

  it("should update on events", async () => {
    mockILS.getLearningProfile.mockReturnValue({});
    mockILS.getRecommendations.mockReturnValue([]);

    let profileListener: any;
    let recsListener: any;

    mockILS.addEventListener.mockImplementation((event, listener) => {
      if (event === "learningProfileUpdated") profileListener = listener;
      if (event === "recommendations") recsListener = listener;
    });

    const { result } = renderHook(() => useLearningProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger profile update
    await act(async () => {
      profileListener({ detail: { id: "updated" } });
    });
    expect(result.current.profile).toEqual({ id: "updated" });

    // Trigger recs update
    await act(async () => {
      recsListener({ detail: [{ id: "newRec" }] });
    });
    expect(result.current.recommendations).toEqual([{ id: "newRec" }]);
  });
});
