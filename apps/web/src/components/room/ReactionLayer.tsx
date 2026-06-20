'use client';

import { REACTIONS, type ReactionEmoji } from '@watchlink/shared';
import type { FloatingReaction } from '@/store/room';
import { cn } from '@/lib/cn';

interface Props {
  /** In-flight reactions to float over the video. */
  reactions: FloatingReaction[];
  /** Fire a reaction for everyone in the room. */
  onReact: (emoji: ReactionEmoji) => void;
  /** Called once a reaction's float animation ends so it can be cleaned up. */
  onDone: (id: string) => void;
}

/**
 * Streaming-style reactions over the video: a tap-able emoji bar plus the
 * emojis other viewers (and you) send floating up and fading out.
 */
export function ReactionLayer({ reactions, onReact, onDone }: Props) {
  return (
    <>
      {/* Floating emojis — non-interactive so they never block the player. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {reactions.map((r) => (
          <span
            key={r.id}
            onAnimationEnd={() => onDone(r.id)}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-16 -translate-x-1/2 animate-float-up select-none text-3xl [filter:drop-shadow(0_2px_8px_rgba(245,158,11,0.35))] sm:text-4xl"
            title={r.name}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Tap bar, bottom-center, above the floating layer. */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
        <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-surface/70 px-2 py-1 shadow-lg backdrop-blur">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              aria-label={`React ${emoji}`}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform duration-150',
                'hover:scale-[1.35] hover:bg-accent-500/15 active:scale-95',
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
