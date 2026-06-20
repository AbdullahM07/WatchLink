'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { PlayerState } from '@watchlink/shared';
import { loadFacebookSdk, onVideoReady, type FBVideoPlayer } from '@/lib/players/facebook';
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

/**
 * Facebook video with full play/pause/seek sync via the Embedded Video Player
 * SDK. If the SDK can't drive the video (blocked, a reel, or a non-embeddable
 * post), it falls back to the plain — unsynced — iframe so the video still plays.
 */
export function FacebookPlayer({
  player,
  canControl,
  syncVersion,
  onPlay,
  onPause,
  onSeek,
  onReady,
  onRegisterTime,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fbRef = useRef<FBVideoPlayer | null>(null);
  const pausedRef = useRef(true);
  const readyRef = useRef(false);
  const suppressUntil = useRef(0);
  const [failed, setFailed] = useState(false);

  const url = player.mediaUrl ?? '';
  const elementId = `fbv-${useId().replace(/[:»]/g, '')}`;

  const cb = useRef({ onPlay, onPause, onSeek, onReady, onRegisterTime, canControl });
  cb.current = { onPlay, onPause, onSeek, onReady, onRegisterTime, canControl };

  // Build the player once per video URL.
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    readyRef.current = false;
    pausedRef.current = true;
    const suppressed = () => Date.now() < suppressUntil.current;

    loadFacebookSdk()
      .then((FB) => {
        if (cancelled || !hostRef.current) return;

        // If no player instance arrives, drop to the plain embed.
        fallbackTimer = setTimeout(() => !readyRef.current && setFailed(true), 9000);

        unsubscribe = onVideoReady(FB, elementId, (fb) => {
          if (cancelled) return;
          fbRef.current = fb;
          readyRef.current = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);

          cb.current.onRegisterTime({
            getCurrentTime: () => num(fb.getCurrentPosition()),
            getDuration: () => num(fb.getDuration()),
          });

          fb.subscribe('startedPlaying', () => {
            pausedRef.current = false;
            if (cb.current.canControl && !suppressed()) cb.current.onPlay(num(fb.getCurrentPosition()));
          });
          fb.subscribe('paused', () => {
            pausedRef.current = true;
            if (cb.current.canControl && !suppressed()) cb.current.onPause(num(fb.getCurrentPosition()));
          });
          fb.subscribe('finishedPlaying', () => {
            pausedRef.current = true;
          });

          cb.current.onReady();

          // Controllers only: detect seeks by watching for jumps (no seek event).
          let last = num(fb.getCurrentPosition());
          let lastWall = Date.now();
          poll = setInterval(() => {
            if (!cb.current.canControl || suppressed()) return;
            const t = num(fb.getCurrentPosition());
            const wall = Date.now();
            const expected = pausedRef.current ? last : last + (wall - lastWall) / 1000;
            if (Math.abs(t - expected) > 1.2) cb.current.onSeek(t);
            last = t;
            lastWall = wall;
          }, 1000);
        });

        // Render the embedded video player into our host element.
        FB.XFBML.parse(hostRef.current);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (poll) clearInterval(poll);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      cb.current.onRegisterTime(null);
      fbRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, elementId]);

  // Reconcile to the authoritative state (loops avoided via suppression).
  useEffect(() => {
    const fb = fbRef.current;
    if (!fb || !readyRef.current) return;
    const guard = () => {
      suppressUntil.current = Date.now() + 800;
    };
    reconcile(
      {
        getCurrentTime: () => num(fb.getCurrentPosition()),
        isPaused: () => pausedRef.current,
        play: () => {
          guard();
          fb.play();
        },
        pause: () => {
          guard();
          fb.pause();
        },
        seekTo: (t) => {
          guard();
          fb.seek(t);
        },
      },
      player,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncVersion]);

  if (failed) {
    // Unsynced fallback so the video still plays.
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    return (
      <div className="space-y-2">
        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
          <iframe
            src={src}
            className="h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
            allowFullScreen
            scrolling="no"
            title="Facebook video"
          />
        </div>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Couldn’t sync this Facebook video — press play together.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
      {/* FB injects an <iframe>; force it to fill the 16:9 stage. */}
      <div
        ref={hostRef}
        className="h-full w-full [&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!h-full [&_iframe]:!w-full [&_span]:!h-full [&_span]:!w-full"
      >
        <div
          key={url}
          id={elementId}
          className="fb-video h-full w-full"
          data-href={url}
          data-allowfullscreen="true"
          data-show-text="false"
          data-width="1280"
        />
      </div>
      {/* Non-controllers watch; the host drives sync. */}
      {!canControl && <div className="absolute inset-0" aria-hidden />}
    </div>
  );
}

/** Coerce the SDK's numbers to a safe finite value. */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
