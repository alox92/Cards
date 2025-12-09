import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ThemeService,
  ThemeDefinition,
} from "../../application/services/ThemeService";

describe("ThemeService", () => {
  let service: ThemeService;

  beforeEach(() => {
    service = new ThemeService();

    // Mock document.documentElement
    // We need to handle the global document object
    // Since we are in a jsdom environment (implied by vitest config usually), document exists.
    // But we want to spy on it or mock the specific parts used by applyPalette.
    // However, applyPalette uses document.documentElement directly.

    // Let's try to spy on document.documentElement if possible, or just rely on jsdom.
    // If jsdom is present, document.documentElement is a real element.
    // We can spy on style.setProperty.

    vi.spyOn(document.documentElement.style, "setProperty");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset theme
    delete document.documentElement.dataset.theme;
  });

  it("should initialize with base themes", () => {
    const themes = service.list();
    expect(themes.length).toBeGreaterThanOrEqual(4);
    expect(themes.find((t) => t.id === "light")).toBeDefined();
    expect(themes.find((t) => t.id === "dark")).toBeDefined();
  });

  it("should get a theme by id", () => {
    const theme = service.get("light");
    expect(theme).toBeDefined();
    expect(theme?.name).toBe("Clair");
  });

  it("should return undefined for unknown theme", () => {
    const theme = service.get("unknown-theme");
    expect(theme).toBeUndefined();
  });

  it("should register a new theme", () => {
    const newTheme: ThemeDefinition = {
      id: "custom",
      name: "Custom",
      className: "theme-custom",
      dark: false,
      palette: { bg: "#123456", text: "#654321", primary: "#abcdef" },
    };

    service.register(newTheme);

    const retrieved = service.get("custom");
    expect(retrieved).toEqual(newTheme);
    expect(service.list()).toContainEqual(newTheme);
  });

  it("should apply a theme", () => {
    service.apply("dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-bg",
      "#0f172a"
    );
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-text",
      "#f1f5f9"
    );
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      "--theme-primary",
      "#3b82f6"
    );
  });

  it("should not apply an unknown theme", () => {
    vi.clearAllMocks();
    service.apply("unknown-theme");

    expect(document.documentElement.style.setProperty).not.toHaveBeenCalled();
    // Should remain unchanged (or undefined if not set previously)
    expect(document.documentElement.dataset.theme).not.toBe("unknown-theme");
  });
});
