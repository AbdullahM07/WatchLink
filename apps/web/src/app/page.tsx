'use client';

import Link from 'next/link';
import { MessageSquare, Mic, MonitorPlay, Play, Smile, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';

export default function LandingPage() {
  const status = useAuthStore((s) => s.status);
  const primaryHref = status === 'authenticated' ? '/create' : '/register';

  return (
    <div className="flex flex-col gap-24 py-6 sm:gap-32">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-fade-in-up text-center lg:text-left">
          <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl">
            Movie night,
            <br />
            <span className="text-brand-300">wherever everyone is.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0">
            Drop in a video link and watch in perfect sync with friends — live chat, floating
            reactions, timestamped notes and one-key push-to-talk. Like sharing a couch, from
            anywhere.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link href={primaryHref}>
              <Button size="lg">
                <Play className="h-4 w-4" />
                Start a room
              </Button>
            </Link>
            <Link href="/join">
              <Button size="lg" variant="secondary">
                Join with a code
              </Button>
            </Link>
          </div>
        </div>

        {/* Cinematic stage — shows the vibe instead of describing it. */}
        <StageMock />
      </section>

      {/* Features — a varied bento, not six identical cards. */}
      <section className="mx-auto w-full max-w-6xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Everything that makes watching <span className="text-brand-300">together</span> feel
          together.
        </h2>

        <div className="mt-8 grid auto-rows-[1fr] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Lead tile — synced playback, spans wide. */}
          <FeatureTile
            className="lg:col-span-2"
            icon={MonitorPlay}
            title="Frame-perfect sync"
            desc="YouTube, direct video and live streams stay in lockstep for the whole room. The host hits play; everyone plays."
            tone="brand"
            large
          />
          <FeatureTile
            icon={Smile}
            title="Reactions that land"
            desc="Float ❤️ 😂 🔥 over the video and feel the room react in the moment."
            tone="accent"
          />
          <FeatureTile
            icon={Mic}
            title="Push-to-talk"
            desc="Hold a key and talk live. Your mic stays off until you press."
            tone="plain"
          />
          <FeatureTile
            icon={MessageSquare}
            title="Live chat & notes"
            desc="Real-time messaging with history, plus notes pinned to the exact timestamp."
            tone="plain"
          />
          <FeatureTile
            icon={Users}
            title="Your room, your rules"
            desc="Public or private, with host controls — lock, transfer, grant control or remove."
            tone="plain"
          />
        </div>
      </section>

      <p className="mx-auto max-w-prose text-center text-sm text-slate-400">
        WatchLink uses official embeds only. We never download, re-host or bypass platform
        protections.
      </p>
    </div>
  );
}

const TONE: Record<'brand' | 'accent' | 'plain', { ring: string; chip: string }> = {
  brand: { ring: 'hover:border-brand-500/50', chip: 'bg-brand-500/15 text-brand-200' },
  accent: { ring: 'hover:border-accent-500/50', chip: 'bg-accent-500/15 text-accent-200' },
  plain: { ring: 'hover:border-surface-border', chip: 'bg-surface-overlay text-slate-300' },
};

function FeatureTile({
  icon: Icon,
  title,
  desc,
  tone,
  className,
  large,
}: {
  icon: typeof MonitorPlay;
  title: string;
  desc: string;
  tone: 'brand' | 'accent' | 'plain';
  className?: string;
  large?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-surface-border bg-surface-raised/50 p-6 transition-colors',
        t.ring,
        className,
      )}
    >
      <span className={cn('mb-4 inline-flex w-fit rounded-xl p-3', t.chip)}>
        <Icon className={cn(large ? 'h-7 w-7' : 'h-6 w-6')} />
      </span>
      <h3 className={cn('font-semibold', large ? 'text-xl' : 'text-lg')}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
    </div>
  );
}

/** Decorative "now playing" stage that hints at the product. Purely visual. */
function StageMock() {
  const floats = [
    { e: '❤️', left: '18%', delay: '0s' },
    { e: '🔥', left: '46%', delay: '0.8s' },
    { e: '😂', left: '72%', delay: '1.6s' },
  ];
  return (
    <div className="animate-fade-in [animation-delay:120ms]" aria-hidden>
      <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-surface-overlay to-surface shadow-2xl shadow-black/40">
        {/* Soft screen glow */}
        <div className="absolute inset-0 bg-[radial-gradient(28rem_18rem_at_50%_38%,rgba(184,90,236,0.22),transparent_70%)]" />

        {/* Play glyph */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
          </span>
        </div>

        {/* Floating reactions */}
        {floats.map((f) => (
          <span
            key={f.e}
            className="absolute bottom-14 animate-float-up text-2xl [animation-iteration-count:infinite]"
            style={{ left: f.left, animationDelay: f.delay }}
          >
            {f.e}
          </span>
        ))}

        {/* Presence row */}
        <div className="absolute left-3 top-3 flex -space-x-2">
          {['A', 'M', 'J', 'K'].map((n, i) => (
            <span
              key={n}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-surface-raised',
                i === 0 ? 'bg-accent-500 text-surface' : 'bg-brand-600/80 text-white',
              )}
            >
              {n}
            </span>
          ))}
        </div>

        {/* Chat bubble */}
        <div className="absolute bottom-3 left-3 max-w-[60%] rounded-2xl rounded-bl-md bg-surface-overlay/90 px-3 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur-sm">
          <span className="font-medium text-brand-200">Maya</span> okay this part is unreal 🍿
        </div>
      </div>
    </div>
  );
}
