/**
 * Imperative accessor a player exposes so the UI can read the *exact* live
 * playback position/duration at the moment of an action (e.g. pinning a note),
 * rather than a throttled, slightly-stale value from state.
 */
export interface PlayerTimeApi {
  getCurrentTime(): number;
  getDuration(): number;
}

export type RegisterTimeApi = (api: PlayerTimeApi | null) => void;
