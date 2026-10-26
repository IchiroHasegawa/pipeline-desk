/**
 * Authorization failures, carrying the HTTP status a route handler should
 * return. Real Error subclasses so `instanceof` and stack traces work.
 */
export class UnauthorizedError extends Error {
  readonly status = 401 as const;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403 as const;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** True for either authorization error, for route-handler error mapping. */
export function isAuthorizationError(
  err: unknown
): err is UnauthorizedError | ForbiddenError {
  return err instanceof UnauthorizedError || err instanceof ForbiddenError;
}
