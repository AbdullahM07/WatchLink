/**
 * Imperative surface a player exposes so an overlay (e.g. the audio-mode panel)
 * can drive the *actual* media element directly. Crucial detail: calling `play()`
 * synchronously from inside a click handler keeps the user-gesture context, so
 * browsers allow audio to start — going through a socket round-trip would lose it.
 */
export interface LocalPlayback {
  /** Start the real element. Returns the play() promise when one exists. */
  play(): Promise<void> | void;
  pause(): void;
  /** Per-user local mute — never synced to the room. */
  setMuted(muted: boolean): void;
  /** Per-user local volume, 0..1 — never synced to the room. */
  setVolume(volume: number): void;
}

export type RegisterLocalPlayback = (api: LocalPlayback | null) => void;
