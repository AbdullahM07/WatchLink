'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, StickyNote, Trash2 } from 'lucide-react';
import type { RoomNote } from '@watchlink/shared';
import { MAX_NOTE_LENGTH } from '@watchlink/shared';
import { formatTimecode } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  notes: RoomNote[];
  selfId: string | null;
  amHost: boolean;
  canControl: boolean;
  /** Reads the exact live playback position (seconds) at the moment of use. */
  getTime: () => number;
  hasMedia: boolean;
  onAdd: (time: number, text: string) => void;
  onDelete: (noteId: string) => void;
  onJump: (time: number) => void;
}

export function NotesPanel({
  notes,
  selfId,
  amHost,
  canControl,
  getTime,
  hasMedia,
  onAdd,
  onDelete,
  onJump,
}: Props) {
  const [text, setText] = useState('');
  const [liveTime, setLiveTime] = useState(0);

  // Keep the "pinned at" label in step with playback.
  useEffect(() => {
    if (!hasMedia) return;
    const id = setInterval(() => setLiveTime(getTime()), 400);
    return () => clearInterval(id);
  }, [hasMedia, getTime]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(getTime(), trimmed); // exact time at submit
    setText('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {notes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-500">
            <StickyNote className="h-8 w-8 text-slate-600" />
            <p>No notes yet.</p>
            <p className="text-xs">Pin a note to the current moment for everyone to see.</p>
          </div>
        )}
        {notes.map((n) => {
          const mine = n.userId === selfId;
          return (
            <div
              key={n.id}
              className="group rounded-xl border border-surface-border bg-surface-overlay/50 p-2.5"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => canControl && onJump(n.time)}
                  disabled={!canControl}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs',
                    canControl
                      ? 'bg-brand-600/20 text-brand-200 hover:bg-brand-600/40'
                      : 'bg-surface-border text-slate-300',
                  )}
                  title={canControl ? 'Jump to this moment' : 'Only the host can jump'}
                >
                  <Clock className="h-3 w-3" />
                  {formatTimecode(n.time)}
                </button>
                <span className="truncate text-xs text-slate-400">{mine ? 'You' : n.name}</span>
                {(mine || amHost) && (
                  <button
                    onClick={() => onDelete(n.id)}
                    className="ml-auto text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{n.text}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-2 border-t border-surface-border p-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          Note will be pinned at{' '}
          <span className="font-mono text-brand-300">{formatTimecode(liveTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            placeholder={hasMedia ? 'Add a note at this moment…' : 'Start a video to add notes'}
            disabled={!hasMedia}
            aria-label="Note text"
            className="h-10 flex-1 rounded-xl border border-surface-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!text.trim() || !hasMedia}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500 disabled:opacity-50"
            aria-label="Add note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
