import type { QueueItem } from '@watchlink/shared';

/**
 * In-memory "up next" queue per room. Volatile by design (like the player store):
 * it lives only while the room is active and is cleared when the room empties.
 */
const store = new Map<string, QueueItem[]>();

/**
 * Per-room stack of previously-played items, most-recent last. Powers "go back":
 * advancing pushes the outgoing item here, going back pops it. Volatile like the
 * queue itself.
 */
const history = new Map<string, QueueItem[]>();

/** Cap a single room's queue so a client can't grow it unbounded. */
const MAX_QUEUE = 50;
/** Cap how far back "previous" can reach so history can't grow unbounded. */
const MAX_HISTORY = 50;

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

/** Put an item back at the FRONT of the queue (e.g. when stepping back). */
export function unshiftQueue(roomCode: string, item: QueueItem): void {
  const items = store.get(roomCode) ?? [];
  store.set(roomCode, [item, ...items].slice(0, MAX_QUEUE));
}

/** Record the item that just stopped playing so "previous" can return to it. */
export function pushHistory(roomCode: string, item: QueueItem): void {
  const items = history.get(roomCode) ?? [];
  items.push(item);
  history.set(roomCode, items.slice(-MAX_HISTORY));
}

/** Pop and return the most recently played item, or undefined if none. */
export function popHistory(roomCode: string): QueueItem | undefined {
  const items = history.get(roomCode);
  if (!items || items.length === 0) return undefined;
  const item = items.pop();
  history.set(roomCode, items);
  return item;
}

export function clearQueue(roomCode: string): void {
  store.delete(roomCode);
  history.delete(roomCode);
}
