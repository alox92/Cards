import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eventBus } from "../../../core/events/EventBus";

// Mock eventBus
vi.mock("../../../core/events/EventBus", () => ({
  eventBus: {
    subscribe: vi.fn(),
    publish: vi.fn(),
  },
}));

describe("GamificationBridge", () => {
  let addXPMock: any;
  let triggerEventMock: any;

  beforeEach(() => {
    vi.resetModules();
    addXPMock = vi.fn();
    triggerEventMock = vi.fn();
    (window as any).aribaGamification = {
      addXP: addXPMock,
      triggerEvent: triggerEventMock,
    };
    (window as any)._gamificationBridgeInstalled = false;
  });

  afterEach(() => {
    delete (window as any).aribaGamification;
    delete (window as any)._gamificationBridgeInstalled;
  });

  it("should subscribe to events on import", async () => {
    await import("../../../application/integration/gamificationBridge");
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "card.reviewed",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "session.progress",
      expect.any(Function)
    );
  });

  it("should award XP on card.reviewed", async () => {
    await import("../../../application/integration/gamificationBridge");

    const calls = (eventBus.subscribe as any).mock.calls;
    const reviewCallback = calls.find((c: any) => c[0] === "card.reviewed")[1];

    // Quality 5 -> Base 2 + Bonus 3 = 5
    reviewCallback({ payload: { quality: 5, deckId: "d1" } });
    expect(addXPMock).toHaveBeenCalledWith(5, "review");
    expect(triggerEventMock).toHaveBeenCalledWith("card_reviewed", {
      quality: 5,
      deckId: "d1",
    });

    addXPMock.mockClear();
    // Quality 3 -> Base 2 + Bonus 1 = 3
    reviewCallback({ payload: { quality: 3, deckId: "d1" } });
    expect(addXPMock).toHaveBeenCalledWith(3, "review");

    addXPMock.mockClear();
    // Quality 1 -> Base 2 + Bonus 0 = 2
    reviewCallback({ payload: { quality: 1, deckId: "d1" } });
    expect(addXPMock).toHaveBeenCalledWith(2, "review");
  });

  it("should award XP on session.progress", async () => {
    await import("../../../application/integration/gamificationBridge");

    const calls = (eventBus.subscribe as any).mock.calls;
    const progressCallback = calls.find(
      (c: any) => c[0] === "session.progress"
    )[1];

    // First update: 10 studied, 8 correct
    // Delta: 10 studied, 8 correct -> XP = 10 + 8 = 18
    progressCallback({ payload: { sessionId: "s1", studied: 10, correct: 8 } });
    expect(addXPMock).toHaveBeenCalledWith(18, "session");
    expect(triggerEventMock).toHaveBeenCalledWith("session_progress", {
      sessionId: "s1",
      studied: 10,
      correct: 8,
    });

    // Second update: 12 studied, 9 correct
    // Delta: 2 studied, 1 correct -> XP = 2 + 1 = 3
    addXPMock.mockClear();
    progressCallback({ payload: { sessionId: "s1", studied: 12, correct: 9 } });
    expect(addXPMock).toHaveBeenCalledWith(3, "session");
  });
});
