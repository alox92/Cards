import { describe, it, expect, vi } from "vitest";
import { container } from "../../application/Container";

describe("Container", () => {
  it("should resolve registered services", () => {
    // Force init
    container.ensureInit();

    const deckService = container.resolve("DeckService");
    expect(deckService).toBeDefined();

    const cardService = container.resolve("CardService");
    expect(cardService).toBeDefined();
  });

  it("should return the same instance (singleton)", () => {
    const s1 = container.resolve("ThemeService");
    const s2 = container.resolve("ThemeService");
    expect(s1).toBe(s2);
  });

  it("should allow manual registration", () => {
    const token = "TestToken";
    const instance = { foo: "bar" };
    container.register(token, () => instance);

    const resolved = container.resolve(token);
    expect(resolved).toBe(instance);
  });

  it("should throw error for unknown token", () => {
    expect(() => container.resolve("UnknownToken")).toThrow(
      "Dépendance non enregistrée"
    );
  });

  it("should return null for safeResolve with unknown token", () => {
    const result = container.safeResolve("UnknownToken");
    expect(result).toBeNull();
  });
});
