/**
 * Loads the official YouTube IFrame Player API exactly once and resolves when
 * `window.YT` is ready. Multiple callers share the same promise.
 */

// Minimal typing for the bits of the IFrame API we use.
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (promise) return promise;

  promise = new Promise<YTNamespace>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return promise;
}
