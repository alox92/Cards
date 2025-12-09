import { describe, it, expect } from "vitest";
import { Validators } from "@/application/services/base/validators";
import { ValidationError } from "@/application/services/base/ServiceError";

describe("Validators", () => {
  describe("validateId", () => {
    it("should pass for valid ID", () => {
      expect(() => Validators.validateId("valid-id", "Resource")).not.toThrow();
    });

    it("should throw for empty ID", () => {
      expect(() => Validators.validateId("", "Resource")).toThrow(
        ValidationError
      );
    });

    it("should throw for null/undefined ID", () => {
      expect(() => Validators.validateId(null, "Resource")).toThrow(
        ValidationError
      );
      expect(() => Validators.validateId(undefined, "Resource")).toThrow(
        ValidationError
      );
    });

    it("should throw for non-string ID", () => {
      expect(() => Validators.validateId(123, "Resource")).toThrow(
        ValidationError
      );
    });
  });

  describe("validateRequiredString", () => {
    it("should pass for valid string", () => {
      expect(() =>
        Validators.validateRequiredString("valid", "Field")
      ).not.toThrow();
    });

    it("should throw for missing value", () => {
      expect(() => Validators.validateRequiredString(null, "Field")).toThrow(
        ValidationError
      );
      expect(() =>
        Validators.validateRequiredString(undefined, "Field")
      ).toThrow(ValidationError);
    });

    it("should validate minLength", () => {
      expect(() =>
        Validators.validateRequiredString("abc", "Field", { minLength: 3 })
      ).not.toThrow();
      expect(() =>
        Validators.validateRequiredString("ab", "Field", { minLength: 3 })
      ).toThrow(ValidationError);
    });

    it("should validate maxLength", () => {
      expect(() =>
        Validators.validateRequiredString("abc", "Field", { maxLength: 3 })
      ).not.toThrow();
      expect(() =>
        Validators.validateRequiredString("abcd", "Field", { maxLength: 3 })
      ).toThrow(ValidationError);
    });

    it("should validate pattern", () => {
      expect(() =>
        Validators.validateRequiredString("abc", "Field", {
          pattern: /^[a-z]+$/,
        })
      ).not.toThrow();
      expect(() =>
        Validators.validateRequiredString("123", "Field", {
          pattern: /^[a-z]+$/,
        })
      ).toThrow(ValidationError);
    });
  });

  describe("validateNumber", () => {
    it("should pass for valid number", () => {
      expect(() => Validators.validateNumber(10, "Field")).not.toThrow();
    });

    it("should throw for non-number", () => {
      expect(() => Validators.validateNumber("10", "Field")).toThrow(
        ValidationError
      );
      expect(() => Validators.validateNumber(NaN, "Field")).toThrow(
        ValidationError
      );
    });

    it("should validate integer", () => {
      expect(() =>
        Validators.validateNumber(10, "Field", { integer: true })
      ).not.toThrow();
      expect(() =>
        Validators.validateNumber(10.5, "Field", { integer: true })
      ).toThrow(ValidationError);
    });

    it("should validate min/max", () => {
      expect(() =>
        Validators.validateNumber(5, "Field", { min: 0, max: 10 })
      ).not.toThrow();
      expect(() => Validators.validateNumber(-1, "Field", { min: 0 })).toThrow(
        ValidationError
      );
      expect(() => Validators.validateNumber(11, "Field", { max: 10 })).toThrow(
        ValidationError
      );
    });

    it("should validate allowNegative", () => {
      expect(() =>
        Validators.validateNumber(-5, "Field", { allowNegative: true })
      ).not.toThrow();
      expect(() =>
        Validators.validateNumber(-5, "Field", { allowNegative: false })
      ).toThrow(ValidationError);
    });
  });
});
