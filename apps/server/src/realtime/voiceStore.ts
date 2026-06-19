/**
 * In-memory voice-session membership (who currently has a live mic in a room).
 *
 * This is a separate, smaller set than room presence: you can be in a room
 * (chatting/watching) without being in the voice mesh. Membership is tracked per
 * socket so multi-tab users are handled correctly — a user counts as "in voice"
 * while at least one of their sockets is connected to the voice session.
 *
 * Single-server design for the MVP, mirroring presence.ts. Move to Redis to scale.
 */
class VoiceStore {
  /** roomCode -> (socketId -> userId) */
  private rooms = new Map<string, Map<string, string>>();
  /** socketId -> roomCode, for quick cleanup on disconnect. */
  private socketRoom = new Map<string, string>();

  join(roomCode: string, socketId: string, userId: string): void {
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = new Map();
      this.rooms.set(roomCode, room);
    }
    room.set(socketId, userId);
    this.socketRoom.set(socketId, roomCode);
  }

  /**
   * Remove one socket from its voice room. Returns the affected room/user and
   * whether that was the user's *last* voice socket (so callers know when to
   * announce a real `voice:peer-left`).
   */
  leave(socketId: string): { roomCode: string; userId: string; lastForUser: boolean } | null {
    const roomCode = this.socketRoom.get(socketId);
    if (!roomCode) return null;
    this.socketRoom.delete(socketId);
    const room = this.rooms.get(roomCode);
    const userId = room?.get(socketId);
    if (!room || userId === undefined) return null;
    room.delete(socketId);
    const lastForUser = ![...room.values()].includes(userId);
    if (room.size === 0) this.rooms.delete(roomCode);
    return { roomCode, userId, lastForUser };
  }

  /** Distinct userIds currently in a room's voice session. */
  userIds(roomCode: string): string[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return [...new Set(room.values())];
  }

  /** All socket ids for a given user in a room's voice session. */
  socketIdsForUser(roomCode: string, userId: string): string[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return [...room.entries()].filter(([, uid]) => uid === userId).map(([sid]) => sid);
  }

  /** Whether the user already has a voice socket in the room. */
  hasUser(roomCode: string, userId: string): boolean {
    return this.userIds(roomCode).includes(userId);
  }

  roomOf(socketId: string): string | undefined {
    return this.socketRoom.get(socketId);
  }
}

export const voiceStore = new VoiceStore();
