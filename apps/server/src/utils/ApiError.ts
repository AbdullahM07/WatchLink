/**
 * Operational error with an HTTP status. Thrown anywhere in the request
 * lifecycle and translated into a uniform response by the error middleware.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = 'Unauthorized', code?: string) {
    return new ApiError(401, message, code);
  }
  static forbidden(message = 'Forbidden', code?: string) {
    return new ApiError(403, message, code);
  }
  static notFound(message = 'Not found', code?: string) {
    return new ApiError(404, message, code);
  }
  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }
  static tooMany(message = 'Too many requests', code?: string) {
    return new ApiError(429, message, code);
  }
  static internal(message = 'Internal server error', code?: string) {
    return new ApiError(500, message, code);
  }
}
