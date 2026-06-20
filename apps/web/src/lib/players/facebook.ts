/**
 * Loads the official Facebook JS SDK exactly once and resolves when `window.FB`
 * is initialised. The SDK powers the Embedded Video Player, which (unlike the
 * raw iframe plugin) exposes play/pause/seek so we can keep the room in sync.
 */

/** The subset of the FB Embedded Video Player API we drive. */
export interface FBVideoPlayer {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  getCurrentPosition(): number;
  getDuration(): number;
  mute(): void;
  unmute(): void;
  isMuted(): boolean;
  subscribe(event: string, cb: () => void): { release(): void };
}

interface XfbmlReadyMsg {
  type: string;
  id: string;
  instance: FBVideoPlayer;
}

export interface FBNamespace {
  init(opts: { xfbml?: boolean; version: string; appId?: string }): void;
  XFBML: { parse(el?: HTMLElement): void };
  Event: {
    subscribe(event: 'xfbml.ready', cb: (msg: XfbmlReadyMsg) => void): void;
    unsubscribe(event: 'xfbml.ready', cb: (msg: XfbmlReadyMsg) => void): void;
  };
}

declare global {
  interface Window {
    FB?: FBNamespace;
    fbAsyncInit?: () => void;
  }
}

let promise: Promise<FBNamespace> | null = null;

export function loadFacebookSdk(): Promise<FBNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.FB) return Promise.resolve(window.FB);
  if (promise) return promise;

  promise = new Promise<FBNamespace>((resolve, reject) => {
    const fail = setTimeout(() => reject(new Error('Facebook SDK failed to load')), 12000);

    window.fbAsyncInit = () => {
      window.FB!.init({ xfbml: false, version: 'v19.0' });
      clearTimeout(fail);
      resolve(window.FB!);
    };

    if (!document.getElementById('facebook-jssdk')) {
      const tag = document.createElement('script');
      tag.id = 'facebook-jssdk';
      tag.src = 'https://connect.facebook.net/en_US/sdk.js';
      tag.async = true;
      tag.defer = true;
      tag.crossOrigin = 'anonymous';
      tag.onerror = () => {
        clearTimeout(fail);
        reject(new Error('Facebook SDK failed to load'));
      };
      document.head.appendChild(tag);
    }
  });
  return promise;
}

/**
 * Subscribe once for the player instance produced when a specific `.fb-video`
 * element (matched by DOM id) finishes rendering. Returns an unsubscribe fn.
 */
export function onVideoReady(
  FB: FBNamespace,
  elementId: string,
  cb: (player: FBVideoPlayer) => void,
): () => void {
  const handler = (msg: XfbmlReadyMsg) => {
    if (msg.type === 'video' && msg.id === elementId) cb(msg.instance);
  };
  FB.Event.subscribe('xfbml.ready', handler);
  return () => FB.Event.unsubscribe('xfbml.ready', handler);
}
