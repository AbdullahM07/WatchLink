'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, StickyNote } from 'lucide-react';
import type { RoomNote } from '@watchlink/shared';
import { MAX_NOTE_LENGTH } from '@watchlink/shared';
import { formatTimecode } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete';
import { EmptyState } from '@/components/ui/EmptyState';
import { fieldClasses } from '@/components/ui/Input';

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
          <EmptyState
            icon={StickyNote}
            tone="accent"
            title="No notes yet"
            description="Pin a note to the current moment — everyone in the room sees it on the timeline."
            className="py-12"
          />
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
                  <ConfirmDelete
                    onConfirm={() => onDelete(n.id)}
                    label="Delete note"
                    className="ml-auto opacity-0 group-hover:opacity-100"
                  />
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
            className={cn(fieldClasses, 'h-10 flex-1 px-3 text-sm disabled:opacity-50')}
          />
          <IconButton type="submit" disabled={!text.trim() || !hasMedia} variant="brand" aria-label="Add note">
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </form>
    </div>
  );
}
