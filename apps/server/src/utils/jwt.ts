import jwt from 'jsonwebtoken';
import type { Role } from '@watchlink/shared';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
  role: Role;
}

/** Sign an access token for a registered user. */
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Verify and decode an access token. Throws on invalid/expired tokens. */
export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Malformed token payload');
  }
  return { sub: String(decoded.sub), role: (decoded as jwt.JwtPayload).role as Role };
}
