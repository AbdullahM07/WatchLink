'use client';

import { Pause, Play, Rewind, FastForward, SkipBack, SkipForward, Square } from 'lucide-react';
import type { PlayerStatus } from '@watchlink/shared';
import type { PlayerTimeApi } from '@/lib/players/timeApi';
import { cn } from '@/lib/cn';

interface Props {
  /** The room's authoritative status — drives the play/pause icon. */
  status: PlayerStatus;
  /** Live time accessor, registered by the active player; null until ready. */
  timeApi: PlayerTimeApi | null;
  /** Whether there's a next item queued (enables ⏭). */
  canGoNext: boolean;
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onStop: () => void;
}

/** How far ⏪ / ⏩ jump, in seconds. */
const SKIP_SECONDS = 10;

/**
 * Synced transport for the cinema (video) presentation. Every action flows
 * through the room's authoritative player so the controller AND every viewer
 * move together — skip works off the live time, play/pause off the room status,
 * and prev/next/stop drive the queue + media lifecycle. Controllers only.
 */
export function PlayerControls({
  status,
  timeApi,
  canGoNext,
  onPlay,
  onPause,
  onSeek,
  onPrevious,
  onNext,
  onStop,
}: Props) {
  const ready = timeApi != null;
  const isPlaying = status === 'playing';

  const skip = (delta: number) => {
    if (!timeApi) return;
    const duration = timeApi.getDuration();
    let next = timeApi.getCurrentTime() + delta;
    next = Math.max(0, next);
    if (Number.isFinite(duration) && duration > 0) next = Math.min(next, duration);
    onSeek(next);
  };

  const togglePlay = () => {
    if (!timeApi) return;
    const t = timeApi.getCurrentTime();
    if (isPlaying) onPause(t);
    else onPlay(t);
  };

  const iconBtn =
    'flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors ' +
    'hover:bg-surface-overlay hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-surface-border bg-surface-raised/60 px-3 py-2">
      <button type="button" onClick={onPrevious} disabled={!ready} className={iconBtn} aria-label="Previous">
        <SkipBack className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => skip(-SKIP_SECONDS)}
        disabled={!ready}
        className={iconBtn}
        aria-label={`Back ${SKIP_SECONDS} seconds`}
      >
        <Rewind className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={togglePlay}
        disabled={!ready}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={cn(
          'mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white',
          'shadow-glow-brand transition-transform hover:scale-105 active:scale-95',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
        )}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
      </button>

      <button
        type="button"
        onClick={() => skip(SKIP_SECONDS)}
        disabled={!ready}
        className={iconBtn}
        aria-label={`Forward ${SKIP_SECONDS} seconds`}
      >
        <FastForward className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={iconBtn}
        aria-label="Next"
        title={canGoNext ? 'Play next in queue' : 'Queue is empty'}
      >
        <SkipForward className="h-5 w-5" />
      </button>

      <span className="mx-1 h-6 w-px bg-surface-border" aria-hidden />

      <button
        type="button"
        onClick={onStop}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-surface-overlay hover:text-red-300"
        aria-label="Stop playback"
        title="Stop — clears the stage for everyone"
      >
        <Square className="h-5 w-5" />
      </button>
    </div>
  );
}
