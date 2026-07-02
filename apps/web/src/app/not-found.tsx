import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
      <Clapperboard className="mx-auto h-12 w-12 text-accent-400" aria-hidden />
      <p className="mt-4 font-display text-5xl font-semibold tracking-tight text-brand-300">404</p>
      <h1 className="mt-2 text-xl font-semibold">This scene isn’t here</h1>
      <p className="mt-2 text-slate-400">
        The page or room you’re looking for doesn’t exist — it may have ended or the link is off by
        a character.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button>Back home</Button>
        </Link>
        <Link href="/join">
          <Button variant="secondary">Join a room</Button>
        </Link>
      </div>
    </div>
  );
}
