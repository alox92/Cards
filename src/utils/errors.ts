// Typage unifié des erreurs de l'application
export class AppError extends Error {
  constructor(message: string, public code?: string, public meta?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
  }
}

export class DataError extends AppError {}
export class NotFoundError extends AppError {}
export class ValidationError extends AppError {}
export class PerformanceError extends AppError {}
export class ServiceError extends AppError {}

export type KnownError = AppError | DataError | NotFoundError | ValidationError | PerformanceError | ServiceError

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err
  if (err instanceof Error) return new AppError(err.message, undefined, { originalName: err.name, stack: err.stack })
  return new AppError('Unknown error', undefined, { value: err })
}
