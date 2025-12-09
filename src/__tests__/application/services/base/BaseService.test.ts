import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BaseService,
  ServiceConfig,
} from "@/application/services/base/BaseService";

// Mock logger to avoid console noise
vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Concrete implementation for testing
class TestService extends BaseService {
  constructor(config: ServiceConfig) {
    super(config);
  }

  public async testOperation<T>(
    operation: () => Promise<T>,
    name: string = "testOperation",
    options?: any
  ): Promise<T> {
    return this.executeWithRetry(operation, name, options);
  }

  public dispose(): void {
    // cleanup
  }
}

describe("BaseService", () => {
  let service: TestService;
  const config: ServiceConfig = {
    name: "TestService",
    retryAttempts: 3,
    retryDelay: 100, // Short delay for tests
    timeout: 1000,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    service = new TestService(config);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("executeWithRetry", () => {
    it("should execute operation successfully on first attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const result = await service.testOperation(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);

      const metrics = service.getMetrics();
      expect(metrics.successfulCalls).toBe(1);
      expect(metrics.failedCalls).toBe(0);
    });

    it("should retry on failure and succeed eventually", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValue("success");

      const promise = service.testOperation(operation);

      // Fast-forward time for retries
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);

      const metrics = service.getMetrics();
      expect(metrics.successfulCalls).toBe(1);
      expect(metrics.failedCalls).toBe(0); // Only final result counts for success/fail in current impl?
      // Actually, let's check implementation.
      // updateMetrics is called with success=true at the end of the loop if successful.
      // It is NOT called for intermediate failures unless it's the last attempt.
    });

    it("should fail after max retries", async () => {
      const error = new Error("Persistent Failure");
      const operation = vi.fn().mockRejectedValue(error);

      const promise = service.testOperation(operation);

      // Handle the promise rejection to avoid "Unhandled Rejection" warning
      // We expect it to reject, so we can catch it and ignore, or just let expect handle it later?
      // The issue is that runAllTimersAsync triggers the rejection before expect attaches.
      // We can attach a no-op catch immediately.
      promise.catch(() => {});

      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(config.retryAttempts!);

      const metrics = service.getMetrics();
      expect(metrics.successfulCalls).toBe(0);
      expect(metrics.failedCalls).toBe(1);
      expect(metrics.lastError).toBeDefined();
    });

    it("should respect custom retry options", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockResolvedValue("success");

      const promise = service.testOperation(operation, "customRetry", {
        retryAttempts: 5,
        retryDelay: 50,
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry if shouldRetry returns false", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Fatal Error"));

      const promise = service.testOperation(operation, "noRetry", {
        shouldRetry: () => false,
      });

      await expect(promise).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("timeout", () => {
    it("should timeout if operation takes too long", async () => {
      // Create a promise that we can control
      let resolveOp: (v: any) => void;
      const operation = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveOp = resolve;
        });
      });

      // Use 1 attempt to avoid waiting for retries
      const promise = service.testOperation(operation, "timeoutTest", {
        retryAttempts: 1,
      });

      // Attach expectation immediately to catch rejection
      const expectPromise = expect(promise).rejects.toThrow(/Timeout/);

      // Advance time past timeout (1000ms)
      await vi.advanceTimersByTimeAsync(1500);

      // Await the expectation
      await expectPromise;

      // Cleanup
      if (resolveOp!) resolveOp("late success");
    });
  });

  describe("metrics", () => {
    it("should track average response time", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      // First call
      await service.testOperation(operation);

      // Second call
      await service.testOperation(operation);

      const metrics = service.getMetrics();
      expect(metrics.totalCalls).toBe(2);
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it("should reset metrics", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      await service.testOperation(operation);

      service.resetMetrics();

      const metrics = service.getMetrics();
      expect(metrics.totalCalls).toBe(0);
      expect(metrics.successfulCalls).toBe(0);
    });
  });
});
