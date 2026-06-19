import type { Response } from 'express';
import type { ApiResponse } from '@watchlink/shared';

/** Send a uniform success envelope. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({ success: true, message, data });
}

/** Send a uniform error envelope. */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({ success: false, message, data: null });
}
