import type { PublicUser } from './user';

/** Uniform REST response envelope used by the whole backend. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface AuthData {
  user: PublicUser;
  token: string;
}
