import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, SocketAuth } from '@watchlink/shared';
import { clientEnv } from './env';

/** Strongly-typed client socket (note: client receives Server→Client events). */
export type AppClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Create a (not-yet-connected) socket with the given auth handshake. */
export function createSocket(auth: SocketAuth): AppClientSocket {
  return io(clientEnv.socketUrl, {
    auth,
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
  });
}
