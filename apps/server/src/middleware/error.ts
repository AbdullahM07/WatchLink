import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { sendError } from '../utils/response';

/** 404 handler for unmatched routes. */
export function notFound(req: Request, res: Response): void {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/** Central error handler — converts any thrown error into a uniform response. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // next is required for Express to recognise this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error({ err }, 'Operational error');
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Mongoose duplicate key (e.g. email already exists).
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    sendError(res, 'A record with that value already exists', 409);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 'Internal server error', 500);
}
