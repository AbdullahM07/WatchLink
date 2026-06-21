'use client';

import { useEffect, useState } from 'react';
import { Radio, AudioLines, Play, Pause, Volume2, VolumeX, Square } from 'lucide-react';
import { QURAN_RADIO, type PlayerStatus, type ProviderResolution } from '@watchlink/shared';
import { cn } from '@/lib/cn';
import type { LocalPlayback } from '@/lib/players/localPlayback';

interface Props {
  resolution: ProviderResolution;
  /** True when the room source is audio-native (radio/podcast), not a hidden video. */
  isAudioSource: boolean;
  /** Direct control over the real media element (null until the player is ready). */
  api: LocalPlayback | null;
  /** Whether the underlying element is actually playing on this client. */
  localPlaying: boolean;
  /** The room's authoritative status — drives the "tap to listen" prompt. */
  roomStatus: PlayerStatus;
  /** Whether this viewer can stop the broadcast for everyone. */
  canControl: boolean;
  /** Stop playback for the whole room (host/controller only). */
  onStop?: () => void;
}

const EQ_BARS = [0, 0.18, 0.36, 0.12, 0.48, 0.24, 0.06];

/**
 * Full-bleed audio presentation laid over the still-playing media element. The
 * real player keeps running and stays in sync underneath; this replaces what's
 * painted (picture hidden) AND carries the only reachable transport controls in
 * audio mode — play/pause, volume, and stop — driven directly through `api` so a
 * tap keeps the user-gesture context the browser needs to let audio start.
 */
export function AudioStageOverlay({
  resolution,
  isAudioSource,
  api,
  localPlaying,
  roomStatus,
  canControl,
  onStop,
}: Props) {
  const isQuran = resolution.embedId === QURAN_RADIO.url;
  const title = isQuran ? QURAN_RADIO.name : 'Audio mode';
  const subtitle = isQuran
    ? QURAN_RADIO.subtitle
    : isAudioSource
      ? 'Listening · audio stream'
      : 'Picture hidden · audio playing';

  // Per-user local sound prefs — never synced to the room.
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Push the local sound prefs onto the element whenever it (re)registers or they change.
  useEffect(() => {
    if (!api) return;
    api.setVolume(volume);
    api.setMuted(muted);
  }, [api, volume, muted]);

  // The room wants playback but this client isn't actually playing — almost always
  // the browser's autoplay-with-sound block. Surface a clear one-tap fix.
  const needsTap = roomStatus === 'playing' && !localPlaying;
  const effectiveMuted = muted || volume === 0;

  const togglePlay = () => {
    if (!api) return;
    if (localPlaying) api.pause();
    else void Promise.resolve(api.play()).catch(() => undefined);
  };

  const onVolume = (next: number) => {
    setVolume(next);
    if (next > 0 && muted) setMuted(false);
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-surface-overlay via-surface to-black text-center"
      // Sits above the hidden media surface and now owns the transport controls.
      style={{ zIndex: 5 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(28rem_18rem_at_50%_35%,rgba(184,90,236,0.18),transparent_70%)]" />

      {/* Stop / exit broadcast — host & controllers only. */}
      {canControl && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised/70 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-300"
        >
          <Square className="h-3.5 w-3.5" /> Stop
        </button>
      )}

      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised/70 text-brand-300 ring-1 ring-white/10 shadow-glow-brand">
        {isQuran ? <Radio className="h-8 w-8" /> : <AudioLines className="h-8 w-8" />}
      </span>

      {/* Equalizer — decorative; only animates while audio is actually playing. */}
      <div className="relative flex h-10 items-end gap-1.5" aria-hidden>
        {EQ_BARS.map((delay, i) => (
          <span
            key={i}
            className="eq-bar w-1.5 rounded-full bg-brand-400/80"
            style={{
              height: '100%',
              animationDelay: `${delay}s`,
              animationPlayState: localPlaying ? 'running' : 'paused',
            }}
          />
        ))}
      </div>

      <div className="relative space-y-1 px-6" dir="auto">
        <p className="text-lg font-semibold text-slate-100">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      {/* Transport — play/pause + volume. Only shown once the player is ready. */}
      {api && (
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={localPlaying ? 'Pause' : 'Play'}
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-glow-brand transition-transform hover:scale-105 active:scale-95',
                needsTap && 'animate-pulse ring-2 ring-brand-300/70',
              )}
            >
              {localPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 translate-x-0.5" />}
            </button>
          </div>

          {needsTap && (
            <p className="text-xs font-medium text-brand-200" dir="auto">
              اضغط للاستماع · Tap to listen
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={effectiveMuted ? 'Unmute' : 'Mute'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-surface-raised/70 hover:text-slate-100"
            >
              {effectiveMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveMuted ? 0 : volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1.5 w-32 cursor-pointer accent-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
