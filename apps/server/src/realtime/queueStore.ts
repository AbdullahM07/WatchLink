import type { QueueItem } from '@watchlink/shared';

/**
 * In-memory "up next" queue per room. Volatile by design (like the player store):
 * it lives only while the room is active and is cleared when the room empties.
 */
const store = new Map<string, QueueItem[]>();

/** Cap a single room's queue so a client can't grow it unbounded. */
const MAX_QUEUE = 50;

export function listQueue(roomCode: string): QueueItem[] {
  return store.get(roomCode) ?? [];
}

export function addToQueue(roomCode: string, item: QueueItem): boolean {
  const items = store.get(roomCode) ?? [];
  if (items.length >= MAX_QUEUE) return false;
  items.push(item);
  store.set(roomCode, items);
  return true;
}

export function removeFromQueue(roomCode: string, id: string): void {
  const items = store.get(roomCode);
  if (!items) return;
  store.set(
    roomCode,
    items.filter((i) => i.id !== id),
  );
}

/** Pop and return the head item (the next video to play), or undefined if empty. */
export function shiftQueue(roomCode: string): QueueItem | undefined {
  const items = store.get(roomCode);
  if (!items || items.length === 0) return undefined;
  const [head, ...rest] = items;
  store.set(roomCode, rest);
  return head;
}

export function clearQueue(roomCode: string): void {
  store.delete(roomCode);
}
