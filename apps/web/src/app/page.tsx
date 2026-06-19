'use client';

import Link from 'next/link';
import { MessageSquare, Mic, MonitorPlay, Smile, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';

const FEATURES = [
  { icon: MonitorPlay, title: 'Synced playback', desc: 'YouTube & direct video stay in lockstep for everyone in the room.' },
  { icon: Mic, title: 'Push-to-talk', desc: 'Hold a key and talk live over WebRTC — mic stays off until you press.' },
  { icon: MessageSquare, title: 'Live chat', desc: 'Real-time messaging with history, so nobody misses the moment.' },
  { icon: Smile, title: 'Reactions', desc: 'Float ❤️ 😂 🔥 over the video and feel the room react together.' },
  { icon: Users, title: 'Rooms & roles', desc: 'Public or private rooms, host controls, kick, lock and transfer.' },
  { icon: Zap, title: 'Fast & secure', desc: 'JWT auth, rate limiting and a hardened realtime layer.' },
];

export default function LandingPage() {
  const status = useAuthStore((s) => s.status);
  const primaryHref = status === 'authenticated' ? '/create' : '/register';

  return (
    <div className="flex flex-col gap-20 py-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center animate-fade-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised px-4 py-1.5 text-sm text-brand-300">
          <Zap className="h-4 w-4" /> Watch anything, together
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">
          Watch in sync.
          <br />
          <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
            React in real time.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
          Create a room, paste a video link, and share it with friends. Everyone watches together —
          with live chat, reactions and push-to-talk voice.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryHref}>
            <Button size="lg">Create a room</Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="secondary">
              Join with a code
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-surface-border bg-surface-raised/60 p-6 transition-colors hover:border-brand-600/60"
          >
            <div className="mb-4 inline-flex rounded-xl bg-brand-600/15 p-3 text-brand-300">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-slate-500">
        WatchLink uses official embeds only. We never download, re-host or bypass platform protections.
      </p>
    </div>
  );
}
