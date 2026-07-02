'use client';

import Link from 'next/link';
import {
  DoorOpen,
  Link2,
  MessageSquare,
  Mic,
  MonitorPlay,
  Play,
  Smile,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cardClasses } from '@/components/ui/Card';
import { PublicRooms } from '@/components/landing/PublicRooms';
import { useReveal } from '@/hooks/useReveal';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';

export default function LandingPage() {
  const status = useAuthStore((s) => s.status);
  const primaryHref = status === 'authenticated' ? '/create' : '/register';

  return (
    <div className="flex flex-col gap-16 py-6 sm:gap-24">
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

      {/* Live directory — jump straight into an open room from the landing page. */}
      <PublicRooms />

      {/* Features — a varied bento, not six identical cards. */}
      <section id="features" className="mx-auto w-full max-w-6xl">
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
            delay={0}
          />
          <FeatureTile
            icon={Smile}
            title="Reactions that land"
            desc="Float ❤️ 😂 🔥 over the video and feel the room react in the moment."
            tone="accent"
            delay={80}
          />
          <FeatureTile
            icon={Mic}
            title="Push-to-talk"
            desc="Hold a key and talk live. Your mic stays off until you press."
            tone="plain"
            delay={160}
          />
          <FeatureTile
            icon={MessageSquare}
            title="Live chat & notes"
            desc="Real-time messaging with history, plus notes pinned to the exact timestamp."
            tone="plain"
            delay={240}
          />
          <FeatureTile
            icon={Users}
            title="Your room, your rules"
            desc="Public or private, with host controls — lock, transfer, grant control or remove."
            tone="plain"
            delay={320}
          />
        </div>
      </section>

      {/* How it works — three steps, from zero to watching together. */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          From link to <span className="text-brand-300">movie night</span> in seconds.
        </h2>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          <HowStep
            step={1}
            icon={DoorOpen}
            title="Start or join"
            desc="Open a room in one tap, or drop in with a 6-character code from a friend."
            delay={0}
          />
          <HowStep
            step={2}
            icon={Link2}
            title="Paste a video"
            desc="Add a YouTube or direct video link. The host drives playback for the whole room."
            delay={100}
          />
          <HowStep
            step={3}
            icon={Sparkles}
            title="Watch together"
            desc="Everyone stays in sync while you chat, float reactions and talk push-to-talk."
            delay={200}
          />
        </ol>
      </section>

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
  delay = 0,
}: {
  icon: typeof MonitorPlay;
  title: string;
  desc: string;
  tone: 'brand' | 'accent' | 'plain';
  className?: string;
  large?: boolean;
  delay?: number;
}) {
  const t = TONE[tone];
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cn(
        cardClasses('raised', 'lg'),
        'flex flex-col shadow-lg shadow-black/20 transition-[transform,opacity] duration-500 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        t.ring,
        className,
      )}
    >
      <span className={cn('mb-4 inline-flex w-fit rounded-xl p-3', t.chip)}>
        <Icon className={cn(large ? 'h-7 w-7' : 'h-6 w-6')} />
      </span>
      <h3 className={cn('font-semibold', large ? 'text-xl' : 'text-lg')}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{desc}</p>
    </div>
  );
}

function HowStep({
  step,
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  step: number;
  icon: typeof MonitorPlay;
  title: string;
  desc: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLLIElement>();
  return (
    <li
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cn(
        cardClasses('raised', 'lg'),
        'relative flex flex-col shadow-lg shadow-black/20 transition-[transform,opacity] duration-500 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 font-display text-sm font-semibold text-brand-200">
          {step}
        </span>
        <Icon className="h-5 w-5 text-slate-400" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{desc}</p>
    </li>
  );
}

/** Decorative "now playing" stage that hints at the product. Purely visual. */
function StageMock() {
  const floats = [
    { e: '❤️', left: '20%', delay: '0s' },
    { e: '🔥', left: '48%', delay: '0.7s' },
    { e: '😂', left: '74%', delay: '1.5s' },
  ];
  return (
    <div className="animate-fade-in [animation-delay:120ms]" aria-hidden>
      <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-surface-overlay to-surface shadow-2xl shadow-black/50 ring-1 ring-inset ring-white/5">
        {/* Lit screen: a warm orchid wash from the center, amber pooling below. */}
        <div className="absolute inset-0 bg-[radial-gradient(26rem_17rem_at_50%_40%,rgba(184,90,236,0.38),transparent_72%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(24rem_12rem_at_50%_120%,rgba(245,158,11,0.16),transparent_75%)]" />
        {/* Cinematic vignette so edges fall to black and the center reads as screen. */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_24px_rgba(0,0,0,0.55)]" />

        {/* Play glyph with a soft orchid halo. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 shadow-[0_0_48px_-4px_rgba(184,90,236,0.7)]">
            <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
          </span>
        </div>

        {/* Floating reactions */}
        {floats.map((f) => (
          <span
            key={f.e}
            className="absolute bottom-16 animate-float-up text-3xl [animation-iteration-count:infinite] [filter:drop-shadow(0_2px_6px_rgba(0,0,0,0.5))]"
            style={{ left: f.left, animationDelay: f.delay }}
          >
            {f.e}
          </span>
        ))}

        {/* Presence — one host speaking, plus the rest of the room. */}
        <div className="absolute left-3 top-3 flex items-center -space-x-2">
          {['A', 'M', 'J', 'K'].map((n, i) => (
            <span key={n} className="relative">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-surface-raised',
                  i === 0 ? 'bg-accent-500 text-surface' : 'bg-brand-600/85 text-white',
                )}
              >
                {n}
              </span>
              {i === 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-live-pulse rounded-full bg-accent-400 ring-2 ring-surface-raised" />
              )}
            </span>
          ))}
          <span className="flex h-7 items-center rounded-full bg-surface-overlay/80 px-2 text-[10px] font-medium text-slate-300 ring-2 ring-surface-raised">
            +2
          </span>
        </div>

        {/* Now-playing chip with a live equalizer (freezes to static bars under reduced-motion). */}
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-surface-overlay/80 px-2.5 py-1 text-[10px] font-medium text-slate-200">
          <span className="flex h-3 items-end gap-[2px]">
            <span className="eq-bar h-3 w-[3px] rounded-full bg-accent-400" style={{ animationDelay: '0s' }} />
            <span className="eq-bar h-3 w-[3px] rounded-full bg-accent-400" style={{ animationDelay: '0.25s' }} />
            <span className="eq-bar h-3 w-[3px] rounded-full bg-accent-400" style={{ animationDelay: '0.5s' }} />
          </span>
          Now playing
        </div>

        {/* Chat bubble */}
        <div className="absolute bottom-11 left-3 max-w-[62%] rounded-2xl rounded-bl-md bg-surface-overlay/90 px-3 py-1.5 text-xs text-slate-200 shadow-lg backdrop-blur-sm">
          <span className="font-medium text-brand-200">Maya</span> okay this part is unreal 🍿
        </div>

        {/* Scrubber — the "it's playing" tell, static so it survives reduced-motion. */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 text-[10px] font-medium tabular-nums text-slate-300">
          <span>12:04</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-white/15">
            <div className="h-full w-[42%] rounded-full bg-accent-400" />
            <span className="absolute left-[42%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-300 shadow ring-2 ring-surface" />
          </div>
          <span>1:52:30</span>
        </div>
      </div>
    </div>
  );
}
