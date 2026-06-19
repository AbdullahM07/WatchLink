import type { ApiResponse } from '@watchlink/shared';
import { clientEnv } from './env';
import { getToken } from './token';

/** Error thrown by `apiFetch` carrying the server message + HTTP status. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip attaching the Authorization header. */
  skipAuth?: boolean;
}

/**
 * Typed fetch wrapper around the WatchLink REST API.
 * Always returns the unwrapped `data` on success; throws `ApiClientError` otherwise.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';

  if (!skipAuth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${clientEnv.apiUrl}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError('Network error — is the server running?', 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    // Non-JSON response (e.g. proxy/HTML error page).
  }

  if (!res.ok || !payload?.success) {
    throw new ApiClientError(payload?.message ?? `Request failed (${res.status})`, res.status);
  }

  return payload.data as T;
}
