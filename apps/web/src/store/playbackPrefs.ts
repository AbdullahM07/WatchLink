'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Per-user, local playback preferences — never synced to the room or other
 * viewers. `audioOnly` collapses the picture into an audio panel so the user
 * can listen to a podcast / recitation, save mobile data on audio sources, and
 * cut distraction. Persisted so the choice survives reloads.
 */
interface PlaybackPrefsState {
  audioOnly: boolean;
  setAudioOnly: (audioOnly: boolean) => void;
  toggleAudioOnly: () => void;
}

export const usePlaybackPrefs = create<PlaybackPrefsState>()(
  persist(
    (set) => ({
      audioOnly: false,
      setAudioOnly: (audioOnly) => set({ audioOnly }),
      toggleAudioOnly: () => set((s) => ({ audioOnly: !s.audioOnly })),
    }),
    { name: 'watchlink:playback-prefs' },
  ),
);
