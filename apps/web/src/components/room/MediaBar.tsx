'use client';

import { useState } from 'react';
import { Link2, MonitorPlay } from 'lucide-react';
import { resolveProvider } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';

interface Props {
  onChangeMedia: (url: string) => void;
}

/** Host-only control to load / change the room's video by URL. */
export function MediaBar({ onChangeMedia }: Props) {
  const [url, setUrl] = useState('');
  const resolution = url.trim() ? resolveProvider(url) : null;
  const invalid = resolution?.provider === 'unsupported';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || invalid) return;
    onChangeMedia(url.trim());
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
            placeholder="Paste a YouTube link or a direct .mp4 / .webm URL"
            aria-label="Video URL"
            className="h-11 w-full rounded-xl border border-surface-border bg-surface pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <Button type="submit" disabled={!url.trim() || invalid}>
          <MonitorPlay className="h-4 w-4" /> Set video
        </Button>
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
