import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SkillTreeService } from "../../application/services/skillTree/SkillTreeService";
import { SkillTree } from "../../application/services/skillTree/ISkillTreeService";

describe("SkillTreeService", () => {
  let service: SkillTreeService;
  let tree: SkillTree;

  beforeEach(async () => {
    service = new SkillTreeService();
    tree = await service.createDefaultTree();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize correctly", () => {
    expect(service.isReady()).toBe(true);
  });

  it("should create default tree with correct structure", async () => {
    const defaultTree = await service.createDefaultTree();
    expect(defaultTree.id).toBe("main-tree");
    expect(defaultTree.nodes.length).toBeGreaterThan(0);
    expect(defaultTree.unlockedNodesCount).toBe(1); // basic-learner is unlocked by default

    const basicLearner = defaultTree.nodes.find(
      (n) => n.id === "basic-learner"
    );
    expect(basicLearner?.unlocked).toBe(true);
  });

  it("should check if node can be unlocked", async () => {
    const node = tree.nodes.find((n) => n.id === "first-deck")!;

    // Not enough points
    expect(await service.canUnlockNode(node, tree)).toBe(false);

    // Add points
    tree = await service.awardPoints(100, tree);

    // Should be unlockable now (prerequisite basic-learner is unlocked)
    expect(await service.canUnlockNode(node, tree)).toBe(true);
  });

  it("should not unlock if already unlocked", async () => {
    const node = tree.nodes.find((n) => n.id === "basic-learner")!;
    expect(await service.canUnlockNode(node, tree)).toBe(false);
  });

  it("should not unlock if prerequisites not met", async () => {
    const node = tree.nodes.find((n) => n.id === "deck-master")!;
    // Prerequisite 'first-deck' is not unlocked
    tree = await service.awardPoints(1000, tree);
    expect(await service.canUnlockNode(node, tree)).toBe(false);
  });

  it("should unlock node successfully", async () => {
    const nodeId = "first-deck";
    tree = await service.awardPoints(100, tree);

    const updatedTree = await service.unlockNode(nodeId, tree);

    const unlockedNode = updatedTree.nodes.find((n) => n.id === nodeId);
    expect(unlockedNode?.unlocked).toBe(true);
    expect(unlockedNode?.unlockedAt).toBeDefined();
    expect(updatedTree.availablePoints).toBe(50); // 100 - 50 cost
    expect(updatedTree.unlockedNodesCount).toBe(2);
  });

  it("should handle unlocking non-existent node", async () => {
    const errorSpy = vi.spyOn(service as any, "error");
    const result = await service.unlockNode("non-existent", tree);

    expect(result).toBe(tree);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("non trouvé")
    );
  });

  it("should handle unlocking node that cannot be unlocked", async () => {
    const errorSpy = vi.spyOn(service as any, "error");
    const nodeId = "first-deck";
    // No points

    const result = await service.unlockNode(nodeId, tree);

    expect(result).toBe(tree);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Impossible de débloquer")
    );
  });

  it("should add progress to node", async () => {
    const nodeId = "basic-learner";

    const updatedTree = await service.addProgressToNode(nodeId, 50, tree);

    const node = updatedTree.nodes.find((n) => n.id === nodeId);
    expect(node?.progress).toBe(50);
  });

  it("should cap progress at 100", async () => {
    const nodeId = "basic-learner";

    let updatedTree = await service.addProgressToNode(nodeId, 80, tree);
    updatedTree = await service.addProgressToNode(nodeId, 30, updatedTree);

    const node = updatedTree.nodes.find((n) => n.id === nodeId);
    expect(node?.progress).toBe(100);
    expect(node?.completedAt).toBeDefined();
  });

  it("should not add progress to locked node", async () => {
    const nodeId = "first-deck"; // Locked

    const updatedTree = await service.addProgressToNode(nodeId, 50, tree);

    const node = updatedTree.nodes.find((n) => n.id === nodeId);
    expect(node?.progress).toBe(0);
  });

  it("should get connections", async () => {
    const connections = await service.getConnections(tree);
    expect(connections.length).toBeGreaterThan(0);

    const connection = connections.find(
      (c) => c.from === "basic-learner" && c.to === "first-deck"
    );
    expect(connection).toBeDefined();
    expect(connection?.unlocked).toBe(true); // basic-learner is unlocked
  });

  it("should get available nodes", async () => {
    // Initially no nodes available (need points)
    let available = await service.getAvailableNodes(tree);
    expect(available.length).toBe(0);

    // Add points
    tree = await service.awardPoints(100, tree);

    available = await service.getAvailableNodes(tree);
    expect(available.length).toBeGreaterThan(0);
    expect(available.some((n) => n.id === "first-deck")).toBe(true);
  });

  it("should award points", async () => {
    const initialPoints = tree.availablePoints;
    const updatedTree = await service.awardPoints(50, tree);
    expect(updatedTree.availablePoints).toBe(initialPoints + 50);
  });

  it("should dispose correctly", () => {
    const logSpy = vi.spyOn(service as any, "log");
    service.dispose();
    expect(logSpy).toHaveBeenCalledWith("SkillTreeService disposed");
  });
});
