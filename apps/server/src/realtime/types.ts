import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  UserIdentity,
} from '@watchlink/shared';

/** Per-socket data populated by the auth middleware. */
export interface SocketData {
  identity: UserIdentity;
}

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
