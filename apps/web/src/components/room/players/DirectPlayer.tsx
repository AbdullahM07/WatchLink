'use client';

import { useEffect, useRef, useState } from 'react';
import type { PlayerState } from '@watchlink/shared';
import { reconcile } from '@/lib/players/reconcile';
import type { RegisterTimeApi } from '@/lib/players/timeApi';

interface Props {
  player: PlayerState;
  canControl: boolean;
  syncVersion: number;
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onReady: () => void;
  onRegisterTime: RegisterTimeApi;
}

/** HTML5 <video> player for direct .mp4/.webm URLs with full playback sync. */
export function DirectPlayer({
  player,
  canControl,
  syncVersion,
  onPlay,
  onPause,
  onSeek,
  onReady,
  onRegisterTime,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  // While we apply a remote state programmatically, ignore the resulting
  // play/pause/seeked events so a controller doesn't echo them back.
  const suppressUntil = useRef(0);

  // Controllers report their local control actions upward.
  useEffect(() => {
    const v = ref.current;
    if (!v || !canControl) return;
    const suppressed = () => Date.now() < suppressUntil.current;
    const handlePlay = () => !suppressed() && onPlay(v.currentTime);
    const handlePause = () => !suppressed() && onPause(v.currentTime);
    const handleSeeked = () => !suppressed() && onSeek(v.currentTime);
    v.addEventListener('play', handlePlay);
    v.addEventListener('pause', handlePause);
    v.addEventListener('seeked', handleSeeked);
    return () => {
      v.removeEventListener('play', handlePlay);
      v.removeEventListener('pause', handlePause);
      v.removeEventListener('seeked', handleSeeked);
    };
  }, [canControl, onPlay, onPause, onSeek]);

  // Expose a precise time accessor + signal ready once metadata loads.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    onRegisterTime({
      getCurrentTime: () => v.currentTime,
      getDuration: () => (Number.isFinite(v.duration) ? v.duration : 0),
    });
    const handleReady = () => onReady();
    v.addEventListener('loadeddata', handleReady);
    return () => {
      v.removeEventListener('loadeddata', handleReady);
      onRegisterTime(null);
    };
  }, [onReady, onRegisterTime]);

  // Reconcile to the authoritative state on every update (loops avoided via suppression).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const guard = () => {
      suppressUntil.current = Date.now() + 600;
    };
    reconcile(
      {
        getCurrentTime: () => v.currentTime,
        isPaused: () => v.paused,
        play: () => {
          guard();
          void v.play().catch(() => undefined);
        },
        pause: () => {
          guard();
          v.pause();
        },
        seekTo: (t) => {
          guard();
          v.currentTime = t;
        },
      },
      player,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVersion]);

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-surface-border bg-black px-6 text-center">
        <p className="text-sm text-slate-400">
          Couldn’t load this video. The file may be unreachable or blocked by CORS
          (the source must allow cross-origin playback).
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
      <video
        ref={ref}
        src={player.mediaUrl ?? undefined}
        controls={canControl}
        playsInline
        className="h-full w-full"
        onError={() => setError(true)}
      />
      {/* Viewers without control can watch but not interact. */}
      {!canControl && <div className="absolute inset-0" aria-hidden />}
    </div>
  );
}
