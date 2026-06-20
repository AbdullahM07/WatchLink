'use client';

import { ListVideo, SkipForward, X } from 'lucide-react';
import type { QueueItem } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  queue: QueueItem[];
  canControl: boolean;
  onPlayNext: () => void;
  onRemove: (id: string) => void;
}

/** Strip protocol/query for a compact, readable label of a queued link. */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

/**
 * The shared "up next" queue. Everyone sees it; only the host / controllers can
 * skip to the next item or remove entries. `queue:next` promotes the head item.
 */
export function QueuePanel({ queue, canControl, onPlayNext, onRemove }: Props) {
  if (queue.length === 0) return null;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <ListVideo className="h-4 w-4 text-brand-400" />
          Up next
          <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-400">
            {queue.length}
          </span>
        </h3>
        {canControl && (
          <Button size="sm" variant="secondary" onClick={onPlayNext}>
            <SkipForward className="h-4 w-4" /> Play next
          </Button>
        )}
      </div>

      <ul className="space-y-1.5">
        {queue.map((item, i) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm"
          >
            <span className="w-5 shrink-0 text-center text-xs text-slate-400">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-slate-200" title={item.url}>
              {shortUrl(item.url)}
            </span>
            <span className="shrink-0 rounded-md bg-surface-overlay px-2 py-0.5 text-[11px] capitalize text-slate-400">
              {item.provider}
            </span>
            {canControl && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label="Remove from queue"
                className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-surface-overlay hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
