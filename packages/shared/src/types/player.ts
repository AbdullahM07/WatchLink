import type { PLAYER_STATUSES, PROVIDERS, VIEWING_MODES } from '../constants';

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];
export type Provider = (typeof PROVIDERS)[number];
export type ViewingMode = (typeof VIEWING_MODES)[number];

/**
 * The authoritative playback state for a room. The host is the source of truth.
 * `serverTimestamp` is the server clock (ms epoch) at which `currentTime` was valid,
 * letting clients compensate for network delay when resuming playback.
 */
export interface PlayerState {
  mediaUrl: string | null;
  provider: Provider;
  mode: ViewingMode;
  status: PlayerStatus;
  /** Position in seconds at `serverTimestamp`. */
  currentTime: number;
  playbackRate: number;
  /** ms epoch (server clock) when this state was last produced. */
  serverTimestamp: number;
  /** User id that last mutated the state (for audit / loop prevention). */
  updatedBy: string | null;
}

/**
 * A video queued to play after the current one. The host (or a controller) builds
 * the queue; `queue:next` promotes the head item to the active player.
 */
export interface QueueItem {
  /** Stable id so clients can dedupe / remove a specific entry. */
  id: string;
  url: string;
  provider: Provider;
  mode: ViewingMode;
  /** User id that added it (for display / audit). */
  addedBy: string | null;
}

/** Result of inspecting a URL: which provider handles it and how. */
export interface ProviderResolution {
  provider: Provider;
  mode: ViewingMode;
  /** Whether this provider supports programmatic play/pause/seek. */
  canControlPlayback: boolean;
  /**
   * Whether the source carries a picture or is audio-only (radio, podcast,
   * direct audio files). Drives the audio-mode presentation on the client.
   */
  kind: 'video' | 'audio';
  /** Normalized id/embed reference when applicable (e.g. YouTube video id). */
  embedId: string | null;
  /** Human-readable reason when provider is `unsupported`. */
  reason?: string;
}
