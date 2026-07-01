'use client';

import { Loader2, WifiOff } from 'lucide-react';
import type { RoomStatus } from '@/store/room';

/**
 * A slim, reassuring banner shown when the live connection drops mid-session.
 * A watch party is fragile — networks blink — so we surface a calm "hang tight"
 * instead of leaving people staring at a frozen room. Hidden while connected.
 */
export function ConnectionBanner({ status }: { status: RoomStatus }) {
  // Only the transient, self-healing states warrant the banner. Terminal states
  // (kicked / closed / error) get their own full-screen cards elsewhere.
  const reconnecting = status === 'reconnecting';
  if (!reconnecting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200 animate-fade-in"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <WifiOff className="h-4 w-4" aria-hidden />
      </span>
      <span className="font-medium">Reconnecting…</span>
      <span className="hidden text-amber-200/70 sm:inline">
        Hang tight — your seat in the room is saved.
      </span>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    </div>
  );
}
