import type { ProviderResolution } from './types/player';

/**
 * Parse a URL only if it is a safe http(s) URL. Rejects javascript:, data:,
 * blob:, file: and anything malformed — these must never reach an embed/player.
 */
export function parseSafeUrl(raw: string): URL | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url;
    return null;
  } catch {
    return null;
  }
}

/** Extract an 11-character YouTube video id from any common YouTube URL shape. */
function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const idRe = /^[a-zA-Z0-9_-]{11}$/;

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? '';
    return idRe.test(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v');
    if (v && idRe.test(v)) return v;
    const parts = url.pathname.split('/').filter(Boolean); // ['embed','ID'] | ['shorts','ID'] | ['v','ID']
    if (parts.length === 2 && ['embed', 'shorts', 'v', 'live'].includes(parts[0]!)) {
      return idRe.test(parts[1]!) ? parts[1]! : null;
    }
  }
  return null;
}

const DIRECT_VIDEO_RE = /\.(mp4|webm|ogg|ogv|m4v|mov)(\?.*)?$/i;
const HLS_RE = /\.m3u8(\?.*)?$/i;

/**
 * Extract the Instagram embed reference (`p/CODE`, `reel/CODE`, `tv/CODE`) from a
 * post/reel URL, so the player can build `instagram.com/<ref>/embed`.
 */
function extractInstagramRef(url: URL): string | null {
  const parts = url.pathname.split('/').filter(Boolean); // ['reel','CODE'] | ['p','CODE'] | ['tv','CODE']
  const codeRe = /^[a-zA-Z0-9_-]+$/;
  if (parts.length >= 2 && ['p', 'reel', 'tv'].includes(parts[0]!) && codeRe.test(parts[1]!)) {
    return `${parts[0]}/${parts[1]}`;
  }
  return null;
}

/** Extract a numeric tweet id from a twitter.com / x.com status URL. */
function extractTweetId(url: URL): string | null {
  const parts = url.pathname.split('/').filter(Boolean); // ['user','status','ID']
  const statusIdx = parts.indexOf('status');
  if (statusIdx === -1) {
    const alt = parts.indexOf('statuses');
    if (alt === -1) return null;
    const id = parts[alt + 1];
    return id && /^\d+$/.test(id) ? id : null;
  }
  const id = parts[statusIdx + 1];
  return id && /^\d+$/.test(id) ? id : null;
}

/**
 * Classify a media URL into a provider and how it can be played.
 *
 * Cinema mode (full play/pause/seek sync): youtube, direct.
 * Social mode (limited control — implemented in phase 5): facebook, tiktok, instagram.
 * Otherwise: unsupported, with a clear human-readable reason.
 */
export function resolveProvider(raw: string): ProviderResolution {
  const url = parseSafeUrl(raw);
  if (!url) {
    return {
      provider: 'unsupported',
      mode: 'cinema',
      canControlPlayback: false,
      embedId: null,
      reason: 'That doesn’t look like a valid http(s) link.',
    };
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  // YouTube
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return { provider: 'youtube', mode: 'cinema', canControlPlayback: true, embedId: ytId };
  }

  // Direct video file
  if (DIRECT_VIDEO_RE.test(url.pathname)) {
    return { provider: 'direct', mode: 'cinema', canControlPlayback: true, embedId: url.toString() };
  }

  // HLS stream (.m3u8) — live matches / streams. Full sync via the same <video> element.
  if (HLS_RE.test(url.pathname)) {
    return { provider: 'hls', mode: 'cinema', canControlPlayback: true, embedId: url.toString() };
  }

  // Social platforms — official embeds only, no precise playback sync.
  if (host === 'facebook.com' || host === 'fb.watch' || host.endsWith('.facebook.com')) {
    // The official video plugin embeds the original URL directly.
    return { provider: 'facebook', mode: 'social', canControlPlayback: false, embedId: url.toString() };
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return { provider: 'tiktok', mode: 'social', canControlPlayback: false, embedId: url.toString() };
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    const ref = extractInstagramRef(url);
    if (ref) {
      return { provider: 'instagram', mode: 'social', canControlPlayback: false, embedId: ref };
    }
    return {
      provider: 'unsupported',
      mode: 'cinema',
      canControlPlayback: false,
      embedId: null,
      reason: 'That Instagram link doesn’t point to a post or reel. Use a /p/, /reel/ or /tv/ link.',
    };
  }
  if (host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com' || host.endsWith('.twitter.com')) {
    const tweetId = extractTweetId(url);
    if (tweetId) {
      return { provider: 'twitter', mode: 'social', canControlPlayback: false, embedId: tweetId };
    }
    return {
      provider: 'unsupported',
      mode: 'cinema',
      canControlPlayback: false,
      embedId: null,
      reason: 'That X/Twitter link doesn’t point to a tweet. Use a link with /status/.',
    };
  }

  return {
    provider: 'unsupported',
    mode: 'cinema',
    canControlPlayback: false,
    embedId: null,
    reason: 'This source isn’t supported. Try a YouTube link, a direct .mp4/.webm file, or an .m3u8 stream.',
  };
}
