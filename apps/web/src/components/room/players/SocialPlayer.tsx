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

/** A landscape 16:9 embed (Facebook video plugin). */
function WideEmbed({ src }: { src: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
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

/** A portrait/variable-height embed (Instagram, X/Twitter) centered on the stage. */
function PortraitEmbed({ src }: { src: string }) {
  return (
    <div className="flex w-full justify-center overflow-hidden rounded-2xl border border-surface-border bg-black">
      <div className="h-[640px] w-full max-w-[550px] overflow-y-auto">
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
    embed = <WideEmbed src={src} />;
  } else if (provider === 'instagram' && embedId) {
    embed = <PortraitEmbed src={`https://www.instagram.com/${embedId}/embed`} />;
  } else if (provider === 'twitter' && embedId) {
    embed = <PortraitEmbed src={`https://platform.twitter.com/embed/Tweet.html?id=${embedId}&theme=dark`} />;
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
