'use client';

import { Users } from 'lucide-react';
import type { Participant } from '@watchlink/shared';
import { Avatar } from './Avatar';

interface Props {
  participants: Participant[];
  selfId: string | null;
}

const MAX_SHOWN = 5;

/**
 * A compact presence strip overlaid on the top-left of the stage. Keeps "who's
 * here" felt without leaving the video — speakers light up with a warm ring.
 */
export function StagePresence({ participants, selfId }: Props) {
  if (participants.length === 0) return null;

  // Surface active speakers and yourself first, then fill remaining slots.
  const ordered = [...participants].sort((a, b) => {
    if (a.isSpeaking !== b.isSpeaking) return a.isSpeaking ? -1 : 1;
    if ((a.userId === selfId) !== (b.userId === selfId)) return a.userId === selfId ? -1 : 1;
    return 0;
  });
  const shown = ordered.slice(0, MAX_SHOWN);
  const overflow = participants.length - shown.length;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface/70 py-1 pl-1 pr-3 shadow-lg backdrop-blur">
        <div className="flex -space-x-2">
          {shown.map((p) => (
            <Avatar
              key={p.userId}
              name={p.name}
              avatar={p.avatar}
              size="xs"
              speaking={p.isSpeaking}
              idleRing="ring-surface"
            />
          ))}
          {overflow > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-overlay text-[10px] font-semibold text-slate-200 ring-2 ring-surface">
              +{overflow}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-200">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {participants.length}
        </span>
      </div>
    </div>
  );
}
