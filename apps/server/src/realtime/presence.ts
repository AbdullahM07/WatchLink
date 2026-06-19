import type { Participant } from '@watchlink/shared';

/**
 * In-memory room presence (live participants per room).
 *
 * Single-server design for the MVP. To scale horizontally, move this state into
 * Redis and add the Socket.IO Redis adapter (documented in the README).
 */

export interface PresenceEntry {
  socketId: string;
  userId: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: number;
}

class PresenceStore {
  /** roomCode -> (socketId -> entry) */
  private rooms = new Map<string, Map<string, PresenceEntry>>();
  /** socketId -> roomCode, for quick cleanup on disconnect. */
  private socketRoom = new Map<string, string>();

  add(roomCode: string, entry: PresenceEntry): void {
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = new Map();
      this.rooms.set(roomCode, room);
    }
    room.set(entry.socketId, entry);
    this.socketRoom.set(entry.socketId, roomCode);
  }

  /** Remove a socket from its room. Returns the room/entry it was removed from. */
  remove(socketId: string): { roomCode: string; entry: PresenceEntry } | null {
    const roomCode = this.socketRoom.get(socketId);
    if (!roomCode) return null;
    this.socketRoom.delete(socketId);
    const room = this.rooms.get(roomCode);
    const entry = room?.get(socketId);
    if (room && entry) {
      room.delete(socketId);
      if (room.size === 0) this.rooms.delete(roomCode);
      return { roomCode, entry };
    }
    return null;
  }

  count(roomCode: string): number {
    return this.rooms.get(roomCode)?.size ?? 0;
  }

  /** Distinct user count (a user may have multiple tabs/sockets). */
  distinctUserCount(roomCode: string): number {
    const room = this.rooms.get(roomCode);
    if (!room) return 0;
    return new Set([...room.values()].map((e) => e.userId)).size;
  }

  getRoomCodeForSocket(socketId: string): string | undefined {
    return this.socketRoom.get(socketId);
  }

  has(roomCode: string, userId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    return [...room.values()].some((e) => e.userId === userId);
  }

  getEntry(socketId: string): PresenceEntry | undefined {
    const roomCode = this.socketRoom.get(socketId);
    if (!roomCode) return undefined;
    return this.rooms.get(roomCode)?.get(socketId);
  }

  socketIdsForUser(roomCode: string, userId: string): string[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return [...room.values()].filter((e) => e.userId === userId).map((e) => e.socketId);
  }

  update(socketId: string, patch: Partial<PresenceEntry>): PresenceEntry | undefined {
    const entry = this.getEntry(socketId);
    if (entry) Object.assign(entry, patch);
    return entry;
  }

  /** Deduplicated participant list (one row per user) for the client. */
  listParticipants(roomCode: string, hostId: string, grantedIds?: Set<string>): Participant[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    const byUser = new Map<string, PresenceEntry>();
    for (const e of room.values()) {
      const existing = byUser.get(e.userId);
      if (!existing || e.joinedAt < existing.joinedAt) byUser.set(e.userId, e);
    }
    return [...byUser.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((e) => ({
        userId: e.userId,
        name: e.name,
        avatar: e.avatar,
        isGuest: e.isGuest,
        isHost: e.userId === hostId,
        canControl: e.userId === hostId || (grantedIds?.has(e.userId) ?? false),
        isSpeaking: e.isSpeaking,
        isMuted: e.isMuted,
        joinedAt: new Date(e.joinedAt).toISOString(),
      }));
  }

  totalConnections(): number {
    return this.socketRoom.size;
  }

  totalRooms(): number {
    return this.rooms.size;
  }
}

export const presence = new PresenceStore();
