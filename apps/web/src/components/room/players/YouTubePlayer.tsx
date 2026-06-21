'use client';

import { useEffect, useRef } from 'react';
import type { PlayerState } from '@watchlink/shared';
import { loadYouTubeApi, type YTPlayer } from '@/lib/players/youtube';
import { reconcile } from '@/lib/players/reconcile';
import type { RegisterTimeApi } from '@/lib/players/timeApi';
import type { RegisterLocalPlayback } from '@/lib/players/localPlayback';

interface Props {
  embedId: string;
  player: PlayerState;
  canControl: boolean;
  syncVersion: number;
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onReady: () => void;
  onRegisterTime: RegisterTimeApi;
  /** Expose direct player control to the audio overlay (optional). */
  onRegisterLocal?: RegisterLocalPlayback;
  /** Report whether the player is actually playing locally (optional). */
  onLocalPlayingChange?: (playing: boolean) => void;
  /** Fired (controllers only) when the video ends, to drive auto-advance. */
  onEnded?: () => void;
}

/** YouTube IFrame Player API wrapper with full play/pause/seek sync. */
export function YouTubePlayer({
  embedId,
  player,
  canControl,
  syncVersion,
  onPlay,
  onPause,
  onSeek,
  onReady,
  onRegisterTime,
  onRegisterLocal,
  onLocalPlayingChange,
  onEnded,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const suppressUntil = useRef(0);

  // Keep latest callbacks/flags without re-creating the player.
  const cb = useRef({
    onPlay, onPause, onSeek, onReady, onRegisterTime, onRegisterLocal, onLocalPlayingChange, onEnded, canControl,
  });
  cb.current = {
    onPlay, onPause, onSeek, onReady, onRegisterTime, onRegisterLocal, onLocalPlayingChange, onEnded, canControl,
  };

  // Create the player once per video id.
  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    readyRef.current = false;
    const suppressed = () => Date.now() < suppressUntil.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      ytRef.current = new YT.Player(hostRef.current, {
        videoId: embedId,
        playerVars: {
          controls: cb.current.canControl ? 1 : 0,
          disablekb: cb.current.canControl ? 0 : 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            cb.current.onRegisterTime({
              getCurrentTime: () => e.target.getCurrentTime(),
              getDuration: () => e.target.getDuration(),
            });
            cb.current.onRegisterLocal?.({
              play: () => e.target.playVideo(),
              pause: () => e.target.pauseVideo(),
              setMuted: (m) => (m ? e.target.mute() : e.target.unMute()),
              setVolume: (vol) => e.target.setVolume(Math.round(vol * 100)),
            });
            cb.current.onReady();
          },
          onStateChange: (e) => {
            // Report local playback state regardless of control so the audio
            // overlay can reflect it (and prompt to tap when autoplay is blocked).
            if (e.data === YT.PlayerState.PLAYING) cb.current.onLocalPlayingChange?.(true);
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
              cb.current.onLocalPlayingChange?.(false);
            }
            // Auto-advance is the controller's job — fire regardless of suppression
            // (the end of a clip is a genuine terminal state, not an echo).
            if (e.data === YT.PlayerState.ENDED && cb.current.canControl) cb.current.onEnded?.();
            if (!cb.current.canControl || suppressed()) return;
            const t = e.target.getCurrentTime();
            if (e.data === YT.PlayerState.PLAYING) cb.current.onPlay(t);
            else if (e.data === YT.PlayerState.PAUSED) cb.current.onPause(t);
          },
        },
      });

      // Controllers only: detect seeks (the IFrame API has no "seeked" event)
      // by watching for jumps between where playback should be and where it is.
      let last = 0;
      let lastWall = Date.now();
      poll = setInterval(() => {
        const p = ytRef.current;
        if (!p || !readyRef.current || !cb.current.canControl || suppressed()) return;
        const t = p.getCurrentTime();
        const wall = Date.now();
        const playing = p.getPlayerState() === 1;
        const expected = playing ? last + (wall - lastWall) / 1000 : last;
        if (Math.abs(t - expected) > 1.2) cb.current.onSeek(t);
        last = t;
        lastWall = wall;
      }, 1000);
    });

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      cb.current.onRegisterTime(null);
      cb.current.onRegisterLocal?.(null);
      cb.current.onLocalPlayingChange?.(false);
      try {
        ytRef.current?.destroy();
      } catch {
        /* ignore */
      }
      ytRef.current = null;
    };
  }, [embedId]);

  // Reconcile to the authoritative state (loops avoided via suppression).
  useEffect(() => {
    const p = ytRef.current;
    if (!p || !readyRef.current) return;
    const guard = () => {
      suppressUntil.current = Date.now() + 700;
    };
    reconcile(
      {
        getCurrentTime: () => p.getCurrentTime(),
        isPaused: () => p.getPlayerState() !== 1,
        play: () => {
          guard();
          p.playVideo();
        },
        pause: () => {
          guard();
          p.pauseVideo();
        },
        seekTo: (t) => {
          guard();
          p.seekTo(t, true);
        },
      },
      player,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVersion]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
      <div ref={hostRef} className="h-full w-full" />
      {!canControl && <div className="absolute inset-0" aria-hidden />}
    </div>
  );
}
