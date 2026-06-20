'use client';

import { useState } from 'react';
import { Link2, ListPlus, MonitorPlay } from 'lucide-react';
import { resolveProvider } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  onChangeMedia: (url: string) => void;
  onAddToQueue: (url: string) => void;
}

/** Host-only control to load the room's video now, or queue it for later. */
export function MediaBar({ onChangeMedia, onAddToQueue }: Props) {
  const [url, setUrl] = useState('');
  const resolution = url.trim() ? resolveProvider(url) : null;
  const invalid = resolution?.provider === 'unsupported';
  const disabled = !url.trim() || invalid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onChangeMedia(url.trim());
    setUrl('');
  };

  const queue = () => {
    if (disabled) return;
    onAddToQueue(url.trim());
    setUrl('');
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-surface-border bg-surface-raised/60 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube link, a direct .mp4 / .webm file, or an .m3u8 live stream"
            aria-label="Video URL"
            className="h-11 w-full rounded-xl border border-surface-border bg-surface pl-10 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={disabled}>
            <MonitorPlay className="h-4 w-4" /> Play now
          </Button>
          <Button type="button" variant="secondary" onClick={queue} disabled={disabled}>
            <ListPlus className="h-4 w-4" /> Add to queue
          </Button>
        </div>
      </div>
      {resolution && (
        <p className={`mt-2 text-xs ${invalid ? 'text-red-400' : 'text-slate-400'}`}>
          {invalid
            ? resolution.reason
            : `Detected: ${resolution.provider}${resolution.mode === 'social' ? ' (social mode)' : ''}`}
        </p>
      )}
    </form>
  );
}
