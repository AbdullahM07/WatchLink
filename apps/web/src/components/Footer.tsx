import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

const exploreLinks = [
  { href: '/#rooms', label: 'Open rooms' },
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/join', label: 'Join with a code' },
];

/** Site-wide footer — gives every page a finished edge and quick way back in. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-accent-400" aria-hidden />
            <span className="font-display text-lg font-semibold tracking-tight">
              Watch<span className="text-brand-300">Link</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Watch videos in perfect sync with friends — live chat, reactions, notes and push-to-talk.
            Like sharing a couch, from anywhere.
          </p>
        </div>

        <nav aria-label="Footer" className="flex gap-12">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explore</h2>
            <ul className="mt-3 space-y-2">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-slate-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-surface-border/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WatchLink. Made for movie nights.</p>
          <p>Official embeds only — we never re-host or bypass platform protections.</p>
        </div>
      </div>
    </footer>
  );
}
