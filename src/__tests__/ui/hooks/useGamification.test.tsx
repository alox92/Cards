import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGamification } from "@/ui/components/Gamification/useGamification";

describe("useGamification", () => {
  const mockGamification = {
    triggerEvent: vi.fn(),
    addXP: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).aribaGamification = mockGamification;
  });

  afterEach(() => {
    delete (window as any).aribaGamification;
  });

  it("should trigger event", () => {
    const { result } = renderHook(() => useGamification());

    result.current.triggerEvent("test_event", { foo: "bar" });

    expect(mockGamification.triggerEvent).toHaveBeenCalledWith("test_event", {
      foo: "bar",
    });
  });

  it("should add XP", () => {
    const { result } = renderHook(() => useGamification());

    result.current.addXP(100, "test_reason");

    expect(mockGamification.addXP).toHaveBeenCalledWith(100, "test_reason");
  });

  it("should do nothing if gamification system is missing", () => {
    delete (window as any).aribaGamification;
    const { result } = renderHook(() => useGamification());

    result.current.triggerEvent("test");
    result.current.addXP(100);

    // Should not throw
    expect(true).toBe(true);
  });
});
