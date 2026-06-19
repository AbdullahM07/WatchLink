import { randomUUID } from 'node:crypto';
import {
  REACTION_RATE_LIMIT,
  reactionSchema,
  type ReactionEvent,
  type ReactionSendPayload,
} from '@watchlink/shared';
import { allow } from '../rateLimiter';
import type { AppServer, AppSocket } from '../types';

/**
 * Streaming-style clickable reactions. Reactions are ephemeral — they're never
 * persisted; we just validate, rate-limit, and fan them out to the room so every
 * client can float the emoji over the video.
 */
export function registerReactionHandlers(io: AppServer, socket: AppSocket): void {
  const me = socket.data.identity;

  socket.on('reaction:send', (payload: ReactionSendPayload) => {
    const roomCode = String(payload?.roomCode ?? '').toUpperCase();
    if (!socket.rooms.has(roomCode)) {
      return socket.emit('error', { message: 'Join the room before reacting', code: 'NOT_IN_ROOM' });
    }
    if (!allow(`${socket.id}:reaction`, REACTION_RATE_LIMIT.points, REACTION_RATE_LIMIT.durationMs)) {
      return socket.emit('error', { message: 'Slow down on the reactions', code: 'RATE_LIMITED' });
    }

    const parsed = reactionSchema.safeParse({ emoji: payload?.emoji });
    if (!parsed.success) {
      return socket.emit('error', {
        message: parsed.error.issues[0]?.message ?? 'Invalid reaction',
        code: 'INVALID_REACTION',
      });
    }

    const reaction: ReactionEvent = {
      id: randomUUID(),
      userId: me.id,
      name: me.name,
      emoji: parsed.data.emoji,
      createdAt: new Date().toISOString(),
    };
    io.to(roomCode).emit('reaction:received', reaction);
  });
}
