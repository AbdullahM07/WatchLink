/**
 * Project-wide constants shared by the frontend and backend.
 * Keeping these in one place prevents the client and server from drifting apart
 * (e.g. both must agree on the max chat length or the sync tolerance).
 */

/** Supported video providers. */
export const PROVIDERS = [
  'youtube',
  'direct',
  'hls',
  'facebook',
  'tiktok',
  'instagram',
  'twitter',
  'unsupported',
] as const;

/** Viewing modes. Cinema = full playback sync; Social = limited-control embeds. */
export const VIEWING_MODES = ['cinema', 'social'] as const;

/**
 * One-tap Quran radio station — a continuous audio stream the host can load for
 * recitation listening parties. Verified to serve `audio/mpeg`.
 */
export const QURAN_RADIO = {
  name: 'إذاعة القرآن الكريم',
  subtitle: 'من القاهرة',
  url: 'https://stream.radiojar.com/8s5u5tpdtwzuv',
} as const;

/** Player status values. */
export const PLAYER_STATUSES = ['playing', 'paused', 'ended'] as const;

/** Allowed reaction emojis (see spec section 9). */
export const REACTIONS = ['❤️', '😂', '😱', '😢', '🔥', '👏'] as const;

/** User roles. */
export const ROLES = ['user', 'admin'] as const;

/** Room visibility. */
export const ROOM_VISIBILITY = ['public', 'private'] as const;

// --- Limits / tuning ---------------------------------------------------------

/** Maximum chat message length (characters). */
export const MAX_CHAT_LENGTH = 1000;

/** How many chat messages we persist / return as history per room. */
export const CHAT_HISTORY_LIMIT = 100;

/** Maximum length of a timestamped note. */
export const MAX_NOTE_LENGTH = 280;

/** How many notes we keep / return per room. */
export const NOTE_HISTORY_LIMIT = 200;

/** Max participants in a single voice (WebRTC mesh) session. */
export const MAX_VOICE_PARTICIPANTS = 6;

/** Default / hard cap for room participants. */
export const DEFAULT_MAX_PARTICIPANTS = 20;
export const ROOM_PARTICIPANTS_HARD_CAP = 50;

/** Seek tolerance in seconds — below this we don't force a seek (avoids jitter). */
export const SYNC_TOLERANCE_SECONDS = 0.5;

/** How often the host broadcasts a periodic sync snapshot (ms). */
export const SYNC_BROADCAST_INTERVAL_MS = 5000;

/** Room code length (short, human-shareable). */
export const ROOM_CODE_LENGTH = 6;

/** Chat rate limit: max messages per window. */
export const CHAT_RATE_LIMIT = { points: 5, durationMs: 3000 } as const;

/** Reaction rate limit: max reactions per window. */
export const REACTION_RATE_LIMIT = { points: 5, durationMs: 2000 } as const;

/** Note rate limit: max notes per window. */
export const NOTE_RATE_LIMIT = { points: 5, durationMs: 5000 } as const;
