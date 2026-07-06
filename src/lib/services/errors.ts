/**
 * Error raised by the service layer. Wraps the underlying Supabase/Postgrest
 * error so route handlers can translate failures into HTTP responses without
 * leaking internals.
 */
export class ServiceError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ServiceError";
    this.cause = cause;
  }
}
