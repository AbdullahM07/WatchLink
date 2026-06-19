/**
 * Tiny in-memory sliding-window rate limiter for socket events.
 * Keyed by an arbitrary string (e.g. `${socketId}:chat`).
 */
interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** Returns true if the action is allowed, false if the limit is exceeded. */
export function allow(key: string, points: number, durationMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < durationMs);
  if (bucket.hits.length >= points) return false;
  bucket.hits.push(now);
  return true;
}

/** Drop all buckets for a socket on disconnect. */
export function clearForSocket(socketId: string): void {
  for (const key of buckets.keys()) {
    if (key.startsWith(`${socketId}:`)) buckets.delete(key);
  }
}
