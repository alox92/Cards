/**
 * 🎯 Système de Gestion d'Erreurs Centralisé pour Services
 *
 * Fournit une hiérarchie d'erreurs typées avec codes d'erreur standardisés
 * et métadonnées pour faciliter le debugging et la gestion d'erreurs.
 */

/**
 * Codes d'erreur standardisés pour tous les services
 */
export enum ServiceErrorCode {
  // Erreurs de validation (4xx équivalent)
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_ID = "INVALID_ID",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_PARAMETER = "INVALID_PARAMETER",

  // Erreurs de ressources (404 équivalent)
  NOT_FOUND = "NOT_FOUND",
  DECK_NOT_FOUND = "DECK_NOT_FOUND",
  CARD_NOT_FOUND = "CARD_NOT_FOUND",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",

  // Erreurs d'opération (500 équivalent)
  OPERATION_FAILED = "OPERATION_FAILED",
  CREATE_FAILED = "CREATE_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED",
  DELETE_FAILED = "DELETE_FAILED",
  QUERY_FAILED = "QUERY_FAILED",

  // Erreurs de logique métier
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  STATE_CONFLICT = "STATE_CONFLICT",
  DEPENDENCY_ERROR = "DEPENDENCY_ERROR",
}

/**
 * Métadonnées optionnelles pour enrichir les erreurs
 */
export interface ServiceErrorMetadata {
  /** ID de la ressource concernée */
  resourceId?: string;
  /** Type de ressource (deck, card, session...) */
  resourceType?: string;
  /** Cause sous-jacente de l'erreur */
  cause?: unknown;
  /** Données contextuelles additionnelles */
  context?: Record<string, unknown>;
  /** Timestamp de l'erreur */
  timestamp?: number;
}

/**
 * Classe de base pour toutes les erreurs de service
 */
export class ServiceError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly metadata: ServiceErrorMetadata;
  public readonly timestamp: number;

  constructor(
    code: ServiceErrorCode,
    message: string,
    metadata: ServiceErrorMetadata = {}
  ) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.timestamp = metadata.timestamp || Date.now();
    this.metadata = { ...metadata, timestamp: this.timestamp };

    // Capturer la stack trace proprement
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Retourne une représentation JSON de l'erreur pour logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Vérifie si l'erreur est une erreur de validation
   */
  isValidationError(): boolean {
    return (
      this.code === ServiceErrorCode.VALIDATION_FAILED ||
      this.code === ServiceErrorCode.INVALID_ID ||
      this.code === ServiceErrorCode.MISSING_REQUIRED_FIELD ||
      this.code === ServiceErrorCode.INVALID_PARAMETER
    );
  }

  /**
   * Vérifie si l'erreur est une erreur "ressource non trouvée"
   */
  isNotFoundError(): boolean {
    return (
      this.code === ServiceErrorCode.NOT_FOUND ||
      this.code === ServiceErrorCode.DECK_NOT_FOUND ||
      this.code === ServiceErrorCode.CARD_NOT_FOUND ||
      this.code === ServiceErrorCode.SESSION_NOT_FOUND
    );
  }
}

/**
 * Erreur de validation spécifique
 */
export class ValidationError extends ServiceError {
  constructor(message: string, metadata: ServiceErrorMetadata = {}) {
    super(ServiceErrorCode.VALIDATION_FAILED, message, metadata);
    this.name = "ValidationError";
  }
}

/**
 * Erreur "ressource non trouvée" spécifique
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, metadata: ServiceErrorMetadata = {}) {
    super(ServiceErrorCode.NOT_FOUND, message, metadata);
    this.name = "NotFoundError";
  }
}

/**
 * Helpers pour créer rapidement des erreurs typées
 */
export const createServiceError = {
  /**
   * Erreur de validation d'ID
   */
  invalidId(resourceType: string, id?: string): ValidationError {
    return new ValidationError(`ID ${resourceType} invalide ou manquant`, {
      resourceType,
      resourceId: id,
    });
  },

  /**
   * Erreur champ requis manquant
   */
  missingField(fieldName: string, resourceType?: string): ValidationError {
    return new ValidationError(`Champ requis manquant: ${fieldName}`, {
      resourceType,
      context: { fieldName },
    });
  },

  /**
   * Erreur ressource non trouvée
   */
  notFound(resourceType: string, id: string): NotFoundError {
    return new NotFoundError(`${resourceType} introuvable`, {
      resourceType,
      resourceId: id,
    });
  },

  /**
   * Erreur d'opération générique
   */
  operationFailed(
    operation: string,
    resourceType: string,
    cause?: unknown
  ): ServiceError {
    return new ServiceError(
      ServiceErrorCode.OPERATION_FAILED,
      `Échec ${operation} ${resourceType}`,
      { resourceType, cause }
    );
  },

  /**
   * Wrapping d'une erreur inconnue en ServiceError
   */
  fromUnknown(error: unknown, context?: string): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new ServiceError(
      ServiceErrorCode.OPERATION_FAILED,
      context ? `${context}: ${message}` : message,
      { cause: error }
    );
  },
};

/**
 * Utilitaire de logging sécurisé avec fallback
 * Gère les loggers partiellement mockés dans les tests
 */
export function safeLog(
  logger: any,
  level: "debug" | "info" | "warn" | "error",
  category: string,
  message: string,
  data?: unknown
): void {
  try {
    if (typeof logger?.[level] === "function") {
      logger[level](category, message, data);
    } else if (typeof logger?.debug === "function") {
      // Fallback sur debug si le niveau demandé n'existe pas
      logger.debug(category, `[${level.toUpperCase()}] ${message}`, data);
    }
  } catch {
    // Ignorer silencieusement les erreurs de logging
    // pour ne pas crasher l'application
  }
}
