/**
 * 🔍 Validateurs Réutilisables pour Services
 *
 * Fournit des fonctions de validation communes pour éviter la duplication
 * et standardiser les messages d'erreur.
 */

import { createServiceError, ValidationError } from "./ServiceError";

/**
 * Configuration de validation pour les nombres
 */
export interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  allowNegative?: boolean;
}

/**
 * Configuration de validation pour les chaînes
 */
export interface StringValidationOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean;
}

/**
 * Classe pour encapsuler les validateurs
 * Méthodes statiques avec annotations de type explicites pour TypeScript strict mode
 */
export class Validators {
  /**
   * Valide qu'un ID n'est pas vide ou null
   *
   * @throws ValidationError si l'ID est invalide
   */
  static validateId: (
    id: unknown,
    resourceType: string
  ) => asserts id is string = (
    id: unknown,
    resourceType: string
  ): asserts id is string => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw createServiceError.invalidId(resourceType, id as string);
    }
  };

  /**
   * Valide qu'une chaîne n'est pas vide
   *
   * @throws ValidationError si la chaîne est invalide
   */
  static validateRequiredString: (
    value: unknown,
    fieldName: string,
    options?: StringValidationOptions
  ) => asserts value is string = (
    value: unknown,
    fieldName: string,
    options: StringValidationOptions = {}
  ): asserts value is string => {
    if (value === null || value === undefined) {
      throw createServiceError.missingField(fieldName);
    }

    if (typeof value !== "string") {
      throw new ValidationError(
        `${fieldName} doit être une chaîne de caractères`,
        { context: { fieldName, actualType: typeof value } }
      );
    }

    const str = options.trim ? value.trim() : value;

    if (options.minLength !== undefined && str.length < options.minLength) {
      throw new ValidationError(
        `${fieldName} doit contenir au moins ${options.minLength} caractères`,
        {
          context: {
            fieldName,
            actualLength: str.length,
            minLength: options.minLength,
          },
        }
      );
    }

    if (options.maxLength !== undefined && str.length > options.maxLength) {
      throw new ValidationError(
        `${fieldName} ne doit pas dépasser ${options.maxLength} caractères`,
        {
          context: {
            fieldName,
            actualLength: str.length,
            maxLength: options.maxLength,
          },
        }
      );
    }

    if (options.pattern && !options.pattern.test(str)) {
      throw new ValidationError(
        `${fieldName} ne correspond pas au format attendu`,
        { context: { fieldName, pattern: options.pattern.source } }
      );
    }
  };

  /**
   * Valide un nombre avec des contraintes optionnelles
   *
   * @throws ValidationError si le nombre est invalide
   */
  static validateNumber: (
    value: unknown,
    fieldName: string,
    options?: NumberValidationOptions
  ) => asserts value is number = (
    value: unknown,
    fieldName: string,
    options: NumberValidationOptions = {}
  ): asserts value is number => {
    if (value === null || value === undefined) {
      throw createServiceError.missingField(fieldName);
    }

    if (typeof value !== "number" || isNaN(value)) {
      throw new ValidationError(`${fieldName} doit être un nombre valide`, {
        context: { fieldName, actualValue: value },
      });
    }

    if (options.integer && !Number.isInteger(value)) {
      throw new ValidationError(`${fieldName} doit être un entier`, {
        context: { fieldName, actualValue: value },
      });
    }

    if (!options.allowNegative && value < 0) {
      throw new ValidationError(`${fieldName} ne peut pas être négatif`, {
        context: { fieldName, actualValue: value },
      });
    }

    if (options.min !== undefined && value < options.min) {
      throw new ValidationError(`${fieldName} doit être >= ${options.min}`, {
        context: { fieldName, actualValue: value, min: options.min },
      });
    }

    if (options.max !== undefined && value > options.max) {
      throw new ValidationError(`${fieldName} doit être <= ${options.max}`, {
        context: { fieldName, actualValue: value, max: options.max },
      });
    }
  };

  /**
   * Valide qu'un tableau n'est pas vide
   *
   * @throws ValidationError si le tableau est invalide
   */
  static validateNonEmptyArray: <T>(
    value: unknown,
    fieldName: string
  ) => asserts value is T[] = <T>(
    value: unknown,
    fieldName: string
  ): asserts value is T[] => {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} doit être un tableau`, {
        context: { fieldName, actualType: typeof value },
      });
    }

    if (value.length === 0) {
      throw new ValidationError(`${fieldName} ne peut pas être vide`, {
        context: { fieldName },
      });
    }
  };

  /**
   * Valide qu'une valeur appartient à un ensemble
   *
   * @throws ValidationError si la valeur n'est pas dans l'ensemble
   */
  static validateEnum: <T>(
    value: unknown,
    allowedValues: readonly T[],
    fieldName: string
  ) => asserts value is T = <T>(
    value: unknown,
    allowedValues: readonly T[],
    fieldName: string
  ): asserts value is T => {
    if (!allowedValues.includes(value as T)) {
      throw new ValidationError(
        `${fieldName} doit être l'une des valeurs: ${allowedValues.join(", ")}`,
        { context: { fieldName, actualValue: value, allowedValues } }
      );
    }
  };

  /**
   * Valide un objet de données de création
   * Vérifie que l'objet n'est pas null et contient au moins une propriété
   */
  static validateCreationData: (
    data: unknown,
    resourceType: string
  ) => asserts data is Record<string, unknown> = (
    data: unknown,
    resourceType: string
  ): asserts data is Record<string, unknown> => {
    if (!data || typeof data !== "object") {
      throw new ValidationError(
        `Données de création ${resourceType} invalides`,
        { resourceType, context: { actualValue: data } }
      );
    }

    if (Array.isArray(data)) {
      throw new ValidationError(
        `Données de création ${resourceType} ne peuvent pas être un tableau`,
        { resourceType }
      );
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      throw new ValidationError(
        `Données de création ${resourceType} ne peuvent pas être vides`,
        { resourceType }
      );
    }
  };
}

/**
 * Fonctions de validation standalone pour une utilisation plus simple
 */

export function validateId(
  id: unknown,
  resourceType: string
): asserts id is string {
  return Validators.validateId(id, resourceType);
}

export function validateRequiredString(
  value: unknown,
  fieldName: string,
  options: StringValidationOptions = {}
): asserts value is string {
  return Validators.validateRequiredString(value, fieldName, options);
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options: NumberValidationOptions = {}
): asserts value is number {
  return Validators.validateNumber(value, fieldName, options);
}

export function validateNonEmptyArray<T>(
  value: unknown,
  fieldName: string
): asserts value is T[] {
  return Validators.validateNonEmptyArray<T>(value, fieldName);
}

export function validateEnum<T>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): asserts value is T {
  return Validators.validateEnum(value, allowedValues, fieldName);
}

export function validateCreationData(
  data: unknown,
  resourceType: string
): asserts data is Record<string, unknown> {
  return Validators.validateCreationData(data, resourceType);
}

/**
 * Type guard pour vérifier si une erreur est une ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    error instanceof ValidationError ||
    (error instanceof Error && error.name === "ValidationError")
  );
}

/**
 * Type guard pour vérifier si un objet a un ID valide
 */
export function hasValidId(obj: unknown): obj is { id: string } {
  try {
    if (!obj || typeof obj !== "object") return false;
    const id = (obj as any).id;
    return typeof id === "string" && id.trim().length > 0;
  } catch {
    return false;
  }
}
