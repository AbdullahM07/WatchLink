'use client';

import { Film } from 'lucide-react';
import { resolveProvider, type PlayerState } from '@watchlink/shared';
import { YouTubePlayer } from './YouTubePlayer';
import { DirectPlayer } from './DirectPlayer';
import { SocialPlayer } from './SocialPlayer';
import type { RegisterTimeApi } from '@/lib/players/timeApi';

interface Props {
  player: PlayerState;
  canControl: boolean;
  syncVersion: number;
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onReady: () => void;
  onRegisterTime: RegisterTimeApi;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-black px-6 text-center">
      <Film className="h-10 w-10 text-slate-600" />
      <p className="font-medium text-slate-300">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{body}</p>
    </div>
  );
}

export function CinemaPlayer(props: Props) {
  const { player } = props;
  const resolution = resolveProvider(player.mediaUrl ?? '');

  if (resolution.provider === 'youtube' && resolution.embedId) {
    return <YouTubePlayer {...props} embedId={resolution.embedId} />;
  }
  if (resolution.provider === 'direct' || resolution.provider === 'hls') {
    return <DirectPlayer {...props} />;
  }
  if (resolution.mode === 'social') {
    return <SocialPlayer player={props.player} canControl={props.canControl} resolution={resolution} />;
  }
  return <Notice title="Unsupported link" body={resolution.reason ?? 'Try a YouTube or direct video URL.'} />;
}
