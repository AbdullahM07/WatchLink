'use client';

import { Info } from 'lucide-react';
import type { PlayerState, ProviderResolution } from '@watchlink/shared';

interface Props {
  player: PlayerState;
  canControl: boolean;
  resolution: ProviderResolution;
}

const FRAME_CLASS = 'h-full w-full border-0';
const ALLOW = 'autoplay; encrypted-media; picture-in-picture; clipboard-write';

/** A landscape 16:9 embed (Facebook video / live). */
function WideEmbed({ src }: { src: string }) {
  return (
    <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
      <iframe
        src={src}
        className={FRAME_CLASS}
        allow={ALLOW}
        allowFullScreen
        scrolling="no"
        title="Social video embed"
      />
    </div>
  );
}

/**
 * A portrait embed centered on the stage. `reel` is a clean 9:16 video frame
 * (Facebook/Instagram reels); `card` is a taller, scrollable box for embeds that
 * include caption chrome (Instagram posts, X/Twitter tweets).
 */
function PortraitEmbed({ src, variant = 'reel' }: { src: string; variant?: 'reel' | 'card' }) {
  const inner =
    variant === 'reel'
      ? 'aspect-[9/16] max-h-[82vh] w-full'
      : 'h-[min(82vh,720px)] w-full overflow-y-auto';
  return (
    <div className="mx-auto flex w-full max-w-[440px] justify-center overflow-hidden rounded-2xl border border-surface-border bg-black">
      <div className={inner}>
        <iframe
          src={src}
          className={FRAME_CLASS}
          allow={ALLOW}
          allowFullScreen
          title="Social post embed"
        />
      </div>
    </div>
  );
}

/**
 * Renders the official embed for social platforms (Facebook / Instagram / X).
 * These platforms expose no programmatic play/pause/seek, so playback is NOT
 * synced between viewers — everyone presses play on their own side.
 */
export function SocialPlayer({ player, resolution }: Props) {
  const { provider, embedId } = resolution;
  const url = player.mediaUrl ?? '';

  let embed: React.ReactNode = null;

  if (provider === 'facebook') {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    // Facebook Reels are portrait 9:16; regular videos and lives are landscape.
    const isReel = /\/reel(s)?\//i.test(url);
    embed = isReel ? <PortraitEmbed src={src} variant="reel" /> : <WideEmbed src={src} />;
  } else if (provider === 'instagram' && embedId) {
    // A reel/ ref is a 9:16 video; posts (p/) and IGTV (tv/) embed as taller cards.
    const variant = embedId.startsWith('reel/') ? 'reel' : 'card';
    embed = <PortraitEmbed src={`https://www.instagram.com/${embedId}/embed`} variant={variant} />;
  } else if (provider === 'twitter' && embedId) {
    embed = <PortraitEmbed src={`https://platform.twitter.com/embed/Tweet.html?id=${embedId}&theme=dark`} variant="card" />;
  }

  if (!embed) {
    // tiktok or any social provider we don't embed yet.
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-black px-6 text-center">
        <Info className="h-8 w-8 text-slate-600" />
        <p className="font-medium text-slate-300">Embed not available</p>
        <p className="max-w-md text-sm text-slate-500">This platform can’t be embedded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {embed}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <Info className="h-3.5 w-3.5" />
        Playback isn’t synced on this platform — press play together.
      </p>
    </div>
  );
}
