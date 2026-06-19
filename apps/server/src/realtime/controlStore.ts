/**
 * In-memory set of users the host has granted playback/media control to,
 * per room. The host always has control implicitly; this tracks *additional*
 * controllers. Cleared when the room empties.
 */
const grants = new Map<string, Set<string>>();

export function grantControl(roomCode: string, userId: string): void {
  let set = grants.get(roomCode);
  if (!set) {
    set = new Set();
    grants.set(roomCode, set);
  }
  set.add(userId);
}

export function revokeControl(roomCode: string, userId: string): void {
  grants.get(roomCode)?.delete(userId);
}

export function hasControl(roomCode: string, userId: string): boolean {
  return grants.get(roomCode)?.has(userId) ?? false;
}

export function grantedIds(roomCode: string): Set<string> {
  return grants.get(roomCode) ?? new Set();
}

export function clearRoom(roomCode: string): void {
  grants.delete(roomCode);
}
