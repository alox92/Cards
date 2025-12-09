import { describe, it, expect } from "vitest";
import {
  ServiceError,
  ServiceErrorCode,
} from "../../../../application/services/base/ServiceError";

describe("ServiceError", () => {
  it("should create an error with code and metadata", () => {
    const meta = { resourceId: "123", context: { foo: "bar" } };
    const error = new ServiceError(
      ServiceErrorCode.NOT_FOUND,
      "Item not found",
      meta
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ServiceError");
    expect(error.code).toBe(ServiceErrorCode.NOT_FOUND);
    expect(error.message).toBe("Item not found");
    expect(error.metadata.resourceId).toBe("123");
    expect(error.metadata.context).toEqual({ foo: "bar" });
    expect(error.timestamp).toBeDefined();
  });

  it("should serialize to JSON", () => {
    const error = new ServiceError(
      ServiceErrorCode.VALIDATION_FAILED,
      "Invalid input"
    );
    const json = error.toJSON();

    expect(json.name).toBe("ServiceError");
    expect(json.code).toBe(ServiceErrorCode.VALIDATION_FAILED);
    expect(json.message).toBe("Invalid input");
    expect(json.timestamp).toBeDefined();
  });

  it("should identify validation errors", () => {
    const e1 = new ServiceError(
      ServiceErrorCode.VALIDATION_FAILED,
      "Val failed"
    );
    expect(e1.isValidationError()).toBe(true);

    const e2 = new ServiceError(ServiceErrorCode.OPERATION_FAILED, "Op failed");
    expect(e2.isValidationError()).toBe(false);
  });
});
