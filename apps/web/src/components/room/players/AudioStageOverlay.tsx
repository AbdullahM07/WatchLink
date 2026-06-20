'use client';

import { Radio, AudioLines } from 'lucide-react';
import { QURAN_RADIO, type ProviderResolution } from '@watchlink/shared';

interface Props {
  resolution: ProviderResolution;
  /** True when the room source is audio-native (radio/podcast), not a hidden video. */
  isAudioSource: boolean;
}

const EQ_BARS = [0, 0.18, 0.36, 0.12, 0.48, 0.24, 0.06];

/**
 * Full-bleed audio presentation laid over the still-playing media element. The
 * real player keeps running and stays in sync underneath; this only replaces
 * what's painted so the picture is hidden (data/battery/distraction win on
 * audio sources, a calmer "listening" surface on everything else).
 */
export function AudioStageOverlay({ resolution, isAudioSource }: Props) {
  const isQuran = resolution.embedId === QURAN_RADIO.url;
  const title = isQuran ? QURAN_RADIO.name : 'Audio mode';
  const subtitle = isQuran
    ? QURAN_RADIO.subtitle
    : isAudioSource
      ? 'Listening · audio stream'
      : 'Picture hidden · audio playing';

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-surface-overlay via-surface to-black text-center"
      // Sits above the hidden media surface; pointer-events pass through to nothing.
      style={{ zIndex: 5 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(28rem_18rem_at_50%_35%,rgba(184,90,236,0.18),transparent_70%)]" />

      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised/70 text-brand-300 ring-1 ring-white/10 shadow-glow-brand">
        {isQuran ? <Radio className="h-8 w-8" /> : <AudioLines className="h-8 w-8" />}
      </span>

      {/* Equalizer — purely decorative, paired with the text labels below. */}
      <div className="relative flex h-10 items-end gap-1.5" aria-hidden>
        {EQ_BARS.map((delay, i) => (
          <span
            key={i}
            className="eq-bar w-1.5 rounded-full bg-brand-400/80"
            style={{ height: '100%', animationDelay: `${delay}s` }}
          />
        ))}
      </div>

      <div className="relative space-y-1 px-6" dir="auto">
        <p className="text-lg font-semibold text-slate-100">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
