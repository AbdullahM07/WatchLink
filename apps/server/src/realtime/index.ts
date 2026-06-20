import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { SYNC_BROADCAST_INTERVAL_MS } from '@watchlink/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { authenticateSocket } from './auth';
import { presence } from './presence';
import { clearForSocket } from './rateLimiter';
import { activeRoomCodes, snapshot } from './playerStore';
import { leaveRoom, registerRoomHandlers } from './handlers/roomHandlers';
import { registerChatHandlers } from './handlers/chatHandlers';
import { registerReactionHandlers } from './handlers/reactionHandlers';
import { registerPlayerHandlers } from './handlers/playerHandlers';
import { registerQueueHandlers } from './handlers/queueHandlers';
import { registerNoteHandlers } from './handlers/noteHandlers';
import { registerVoiceHandlers } from './handlers/voiceHandlers';
import type { AppServer, AppSocket } from './types';

let io: AppServer | null = null;

/** Attach Socket.IO to the HTTP server and wire up all realtime handlers. */
export function setupSocket(httpServer: HttpServer): AppServer {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    maxHttpBufferSize: 1e6, // 1 MB cap on any single payload
  });

  io.use((socket, next) => {
    void authenticateSocket(socket as AppSocket, next);
  });

  io.on('connection', (socket: AppSocket) => {
    const me = socket.data.identity;
    logger.debug({ id: me.id }, 'socket connected');

    // Tell the client its trusted identity (client never derives this itself).
    socket.emit('session', { userId: me.id, name: me.name, isGuest: me.isGuest });

    registerRoomHandlers(io!, socket);
    registerChatHandlers(io!, socket);
    registerReactionHandlers(io!, socket);
    registerPlayerHandlers(io!, socket);
    registerQueueHandlers(io!, socket);
    registerNoteHandlers(io!, socket);
    registerVoiceHandlers(io!, socket);

    socket.on('disconnect', () => {
      const roomCode = presence.getRoomCodeForSocket(socket.id);
      if (roomCode) void leaveRoom(io!, socket, roomCode);
      clearForSocket(socket.id);
    });
  });

  // Periodic drift correction: re-broadcast the authoritative snapshot to every
  // active, currently-playing room so laggy/late clients converge (within tolerance).
  const syncTimer = setInterval(() => {
    for (const code of activeRoomCodes()) {
      if (presence.distinctUserCount(code) === 0) continue;
      const snap = snapshot(code);
      if (snap?.mediaUrl && snap.status === 'playing') {
        io!.to(code).emit('player:sync-state', snap);
      }
    }
  }, SYNC_BROADCAST_INTERVAL_MS);
  syncTimer.unref?.();

  return io;
}

/** Access the initialized server (used by other phases, e.g. voice/admin). */
export function getIo(): AppServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
