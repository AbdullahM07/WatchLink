import type { ROLES } from '../constants';

export type Role = (typeof ROLES)[number];

/**
 * Public-facing user shape. NEVER includes passwordHash.
 * This is what every API response and socket payload may expose.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** A lightweight identity used inside rooms (registered user OR guest). */
export interface UserIdentity {
  id: string;
  name: string;
  avatar: string | null;
  /** Guests are ephemeral and have no account. */
  isGuest: boolean;
}
