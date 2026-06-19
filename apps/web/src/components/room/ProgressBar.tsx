'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, StickyNote, X } from 'lucide-react';
import type { RoomNote } from '@watchlink/shared';
import { MAX_NOTE_LENGTH } from '@watchlink/shared';
import { formatTimecode } from '@/lib/format';
import type { PlayerTimeApi } from '@/lib/players/timeApi';
import { cn } from '@/lib/cn';

interface Props {
  /** Reads the live player time/duration; null until the player is ready. */
  timeApi: PlayerTimeApi | null;
  notes: RoomNote[];
  canControl: boolean;
  onAddNote: (time: number, text: string) => void;
  onJump: (time: number) => void;
}

/**
 * A notes timeline under the video: shows playback progress + a pin for every
 * note. Click anywhere on the bar to pin a NEW note at that exact moment;
 * click a pin to jump there (controllers only).
 */
export function ProgressBar({ timeApi, notes, canControl, onAddNote, onJump }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ time: number; ratio: number } | null>(null);
  const [text, setText] = useState('');

  // Poll the live time so the playhead is smooth and accurate.
  useEffect(() => {
    if (!timeApi) return;
    const id = setInterval(() => {
      setCurrent(timeApi.getCurrentTime());
      setDuration(timeApi.getDuration());
    }, 250);
    return () => clearInterval(id);
  }, [timeApi]);

  const ratioToTime = (clientX: number): { time: number; ratio: number } | null => {
    const el = trackRef.current;
    if (!el || duration <= 0) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return { time: ratio * duration, ratio };
  };

  const onTrackClick = (e: React.MouseEvent) => {
    const hit = ratioToTime(e.clientX);
    if (!hit) return;
    setDraft(hit);
    setText('');
  };

  const submitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const trimmed = text.trim();
    if (trimmed) onAddNote(draft.time, trimmed);
    setDraft(null);
    setText('');
  };

  const playedPct = duration > 0 ? (current / duration) * 100 : 0;
  const disabled = duration <= 0;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised/60 px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />
          {disabled ? 'Start a video to pin notes' : 'Click the bar to pin a note at any moment'}
        </span>
        <span className="font-mono text-slate-300">
          {formatTimecode(current)}
          {duration > 0 && ` / ${formatTimecode(duration)}`}
        </span>
      </div>

      <div className="relative pt-6">
        {/* Draft composer popover */}
        {draft && (
          <form
            onSubmit={submitDraft}
            className="absolute bottom-7 z-20 w-64 -translate-x-1/2 rounded-xl border border-surface-border bg-surface-overlay p-2 shadow-xl"
            style={{ left: `${Math.min(85, Math.max(15, draft.ratio * 100))}%` }}
          >
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-brand-300">{formatTimecode(draft.time)}</span>
              <button type="button" onClick={() => setDraft(null)} aria-label="Cancel">
                <X className="h-3.5 w-3.5 hover:text-slate-200" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_NOTE_LENGTH}
                placeholder="Note at this moment…"
                className="h-9 flex-1 rounded-lg border border-surface-border bg-surface px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50"
                aria-label="Add note"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* Track */}
        <div
          ref={trackRef}
          onClick={disabled ? undefined : onTrackClick}
          onMouseMove={(e) => !disabled && setHoverRatio(ratioToTime(e.clientX)?.ratio ?? null)}
          onMouseLeave={() => setHoverRatio(null)}
          className={cn(
            'relative h-2.5 rounded-full bg-surface-border',
            !disabled && 'cursor-pointer',
          )}
          role="slider"
          aria-label="Notes timeline"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(current)}
        >
          {/* Played fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brand-500/70"
            style={{ width: `${playedPct}%` }}
          />
          {/* Hover indicator */}
          {hoverRatio !== null && !draft && (
            <div
              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-slate-300/60"
              style={{ left: `${hoverRatio * 100}%` }}
            />
          )}
          {/* Note markers */}
          {duration > 0 &&
            notes.map((n) => (
              <button
                key={n.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canControl) onJump(n.time);
                }}
                style={{ left: `${(n.time / duration) * 100}%` }}
                className={cn(
                  'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-amber-400 transition hover:scale-125',
                  canControl ? 'cursor-pointer' : 'cursor-default',
                )}
                title={`${formatTimecode(n.time)} — ${n.name}: ${n.text}`}
                aria-label={`Note by ${n.name} at ${formatTimecode(n.time)}`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
