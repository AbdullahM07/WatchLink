'use client';

import { REACTIONS, type ReactionEmoji } from '@watchlink/shared';
import type { FloatingReaction } from '@/store/room';
import { cn } from '@/lib/cn';

interface LayerProps {
  /** In-flight reactions to float over the video. */
  reactions: FloatingReaction[];
  /** Called once a reaction's float animation ends so it can be cleaned up. */
  onDone: (id: string) => void;
}

/**
 * The floating half: emojis other viewers (and you) send drift up over the video
 * and fade out. Non-interactive, so it never blocks the player. Sits absolutely
 * inside the stage; the tap bar (`ReactionBar`) lives separately below the video.
 */
export function ReactionLayer({ reactions, onDone }: LayerProps) {
  return (
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
  );
}

interface BarProps {
  /** Fire a reaction for everyone in the room. */
  onReact: (emoji: ReactionEmoji) => void;
}

/**
 * The tap bar: a row of emoji buttons. Rendered as its own block below the video
 * so it sits clear of the frame instead of crowding it. Emojis it fires still
 * float up over the video via `ReactionLayer`.
 */
export function ReactionBar({ onReact }: BarProps) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-0.5 rounded-full border border-surface-border bg-surface-raised/60 px-1.5 py-1">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji)}
            aria-label={`React ${emoji}`}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full text-xl transition-transform duration-150',
              'hover:scale-[1.35] hover:bg-accent-500/15 active:scale-95',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
