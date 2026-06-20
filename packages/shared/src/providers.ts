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

  // Social platforms — official embeds only, limited control (phase 5).
  if (host === 'facebook.com' || host === 'fb.watch' || host.endsWith('.facebook.com')) {
    return { provider: 'facebook', mode: 'social', canControlPlayback: false, embedId: url.toString() };
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    return { provider: 'tiktok', mode: 'social', canControlPlayback: false, embedId: url.toString() };
  }
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    return { provider: 'instagram', mode: 'social', canControlPlayback: false, embedId: url.toString() };
  }

  return {
    provider: 'unsupported',
    mode: 'cinema',
    canControlPlayback: false,
    embedId: null,
    reason: 'This source isn’t supported. Try a YouTube link, a direct .mp4/.webm file, or an .m3u8 stream.',
  };
}
