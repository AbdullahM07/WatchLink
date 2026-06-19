import { SYNC_TOLERANCE_SECONDS, type PlayerState } from '@watchlink/shared';

/** Imperative surface every player adapter exposes for reconciliation. */
export interface PlayerControls {
  getCurrentTime(): number;
  isPaused(): boolean;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
}

/**
 * Bring a follower's player in line with the host's authoritative state.
 * The server already advances `currentTime` to "now", so we seek straight to it;
 * differences under the tolerance are ignored to avoid constant micro-seeking.
 */
export function reconcile(controls: PlayerControls, desired: PlayerState): void {
  const now = controls.getCurrentTime();
  const target = desired.currentTime;

  if (Number.isFinite(target) && Math.abs(now - target) > SYNC_TOLERANCE_SECONDS) {
    controls.seekTo(target);
  }
  if (desired.status === 'playing' && controls.isPaused()) {
    controls.play();
  } else if (desired.status !== 'playing' && !controls.isPaused()) {
    controls.pause();
  }
}
