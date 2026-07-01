import { describe, expect, it, vi } from 'vitest';
import type { PlayerState } from '@watchlink/shared';
import { reconcile, type PlayerControls } from './reconcile';

function makeControls(overrides: Partial<PlayerControls> = {}): PlayerControls {
  return {
    getCurrentTime: vi.fn(() => 0),
    isPaused: vi.fn(() => true),
    play: vi.fn(),
    pause: vi.fn(),
    seekTo: vi.fn(),
    ...overrides,
  };
}

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    mediaUrl: 'https://example.com/video',
    provider: 'youtube',
    mode: 'cinema',
    status: 'playing',
    currentTime: 0,
    playbackRate: 1,
    serverTimestamp: Date.now(),
    updatedBy: null,
    ...overrides,
  };
}

describe('reconcile', () => {
  it('seeks when the drift exceeds the sync tolerance', () => {
    const controls = makeControls({ getCurrentTime: vi.fn(() => 10) });
    reconcile(controls, makeState({ currentTime: 12 }));
    expect(controls.seekTo).toHaveBeenCalledWith(12);
  });

  it('does not seek when the drift is within the sync tolerance', () => {
    const controls = makeControls({ getCurrentTime: vi.fn(() => 10) });
    reconcile(controls, makeState({ currentTime: 10.2 }));
    expect(controls.seekTo).not.toHaveBeenCalled();
  });

  it('ignores a non-finite target time', () => {
    const controls = makeControls({ getCurrentTime: vi.fn(() => 10) });
    reconcile(controls, makeState({ currentTime: Number.NaN }));
    expect(controls.seekTo).not.toHaveBeenCalled();
  });

  it('plays when the desired state is playing but the player is paused', () => {
    const controls = makeControls({ isPaused: vi.fn(() => true) });
    reconcile(controls, makeState({ status: 'playing' }));
    expect(controls.play).toHaveBeenCalledOnce();
    expect(controls.pause).not.toHaveBeenCalled();
  });

  it('pauses when the desired state is not playing but the player is playing', () => {
    const controls = makeControls({ isPaused: vi.fn(() => false) });
    reconcile(controls, makeState({ status: 'paused' }));
    expect(controls.pause).toHaveBeenCalledOnce();
    expect(controls.play).not.toHaveBeenCalled();
  });

  it('leaves play state untouched when already matching', () => {
    const controls = makeControls({ isPaused: vi.fn(() => false) });
    reconcile(controls, makeState({ status: 'playing' }));
    expect(controls.play).not.toHaveBeenCalled();
    expect(controls.pause).not.toHaveBeenCalled();
  });
});
