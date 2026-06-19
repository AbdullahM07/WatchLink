import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and replaces `req[source]` with the parsed/typed value.
 * On failure, throws a 400 ApiError with the first readable issue.
 */
export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Express 4 query/params are read-only getters in some setups; assign safely.
      Object.defineProperty(req, source, { value: parsed, writable: true, configurable: true });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path.join('.') ?? '';
        const msg = first ? `${path ? `${path}: ` : ''}${first.message}` : 'Invalid request';
        next(ApiError.badRequest(msg, 'VALIDATION_ERROR'));
        return;
      }
      next(err);
    }
  };
}
