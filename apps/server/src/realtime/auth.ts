import { customAlphabet } from 'nanoid';
import type { SocketAuth, UserIdentity } from '@watchlink/shared';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import type { AppSocket } from './types';

const guestId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

function sanitizeGuestName(name: string | undefined): string {
  const trimmed = (name ?? '').trim().slice(0, 40);
  return trimmed.length >= 2 ? trimmed : 'Guest';
}

/**
 * Socket.IO connection auth. Resolves a trusted identity from the JWT (registered
 * user) or creates an ephemeral guest. The identity is the ONLY source of userId
 * for every subsequent event — client-supplied ids are never trusted.
 */
export async function authenticateSocket(
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const auth = (socket.handshake.auth ?? {}) as SocketAuth;

    if (auth.token) {
      const payload = verifyAccessToken(auth.token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('User not found'));
      if (user.isBlocked) return next(new Error('Account blocked'));

      const identity: UserIdentity = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isGuest: false,
      };
      socket.data.identity = identity;
      return next();
    }

    // Guest path.
    const identity: UserIdentity = {
      id: `guest_${guestId()}`,
      name: sanitizeGuestName(auth.guestName),
      avatar: null,
      isGuest: true,
    };
    socket.data.identity = identity;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
}
