import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

/** Extract a Bearer token from the Authorization header. */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/** Require a valid JWT. Populates `req.auth`. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized('Authentication required', 'NO_TOKEN'));
    return;
  }
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token', 'BAD_TOKEN'));
  }
}

/** Require the authenticated user to be an admin. Must run after `authenticate`. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== 'admin') {
    next(ApiError.forbidden('Admin access required', 'NOT_ADMIN'));
    return;
  }
  next();
}
