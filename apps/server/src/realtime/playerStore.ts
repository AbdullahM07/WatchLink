import type { PlayerState } from '@watchlink/shared';

/**
 * In-memory authoritative player state per room (the host drives it; the server
 * relays it). Mirrors Room.player in the DB, which is the durable copy used to
 * restore state when the room is empty and someone rejoins.
 */
const store = new Map<string, PlayerState>();

export function setPlayer(roomCode: string, state: PlayerState): void {
  store.set(roomCode, state);
}

export function getPlayer(roomCode: string): PlayerState | undefined {
  return store.get(roomCode);
}

export function hasPlayer(roomCode: string): boolean {
  return store.has(roomCode);
}

export function dropPlayer(roomCode: string): void {
  store.delete(roomCode);
}

export function activeRoomCodes(): string[] {
  return [...store.keys()];
}

/**
 * A snapshot with `currentTime` advanced to "now" if playing, and a fresh
 * `serverTimestamp`. Clients can seek straight to `currentTime` (the small
 * transit latency stays well within the sync tolerance).
 */
export function snapshot(roomCode: string): PlayerState | undefined {
  const s = store.get(roomCode);
  if (!s) return undefined;
  const now = Date.now();
  const elapsed = s.status === 'playing' ? ((now - s.serverTimestamp) / 1000) * s.playbackRate : 0;
  return {
    ...s,
    currentTime: Math.max(0, s.currentTime + elapsed),
    serverTimestamp: now,
  };
}
