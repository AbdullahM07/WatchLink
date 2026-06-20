'use client';

import { Film } from 'lucide-react';
import { resolveProvider, type PlayerState } from '@watchlink/shared';
import { YouTubePlayer } from './YouTubePlayer';
import { DirectPlayer } from './DirectPlayer';
import { FacebookPlayer } from './FacebookPlayer';
import { SocialPlayer } from './SocialPlayer';
import { AudioStageOverlay } from './AudioStageOverlay';
import type { RegisterTimeApi } from '@/lib/players/timeApi';

interface Props {
  player: PlayerState;
  canControl: boolean;
  syncVersion: number;
  /** Paint the audio presentation over the (still-playing, still-synced) player. */
  audioUi: boolean;
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
      <p className="max-w-md text-sm text-slate-400">{body}</p>
    </div>
  );
}

export function CinemaPlayer({ audioUi, ...props }: Props) {
  const { player } = props;
  const resolution = resolveProvider(player.mediaUrl ?? '');

  // Players that drive a real audio/video element we can hide behind the audio
  // overlay while keeping playback + sync alive underneath.
  let inner: React.ReactNode = null;
  if (resolution.provider === 'youtube' && resolution.embedId) {
    inner = <YouTubePlayer {...props} embedId={resolution.embedId} />;
  } else if (resolution.provider === 'direct' || resolution.provider === 'hls') {
    inner = <DirectPlayer {...props} />;
  } else if (resolution.provider === 'facebook' && resolution.canControlPlayback) {
    // Regular Facebook videos sync via the Embedded Video Player SDK.
    inner = <FacebookPlayer {...props} />;
  }

  if (inner) {
    return (
      <div className="relative">
        {inner}
        {audioUi && (
          <AudioStageOverlay resolution={resolution} isAudioSource={resolution.kind === 'audio'} />
        )}
      </div>
    );
  }

  // Reels and the other social platforms have no playback API — embeds only.
  if (resolution.mode === 'social') {
    return <SocialPlayer player={props.player} canControl={props.canControl} resolution={resolution} />;
  }
  return <Notice title="Unsupported link" body={resolution.reason ?? 'Try a YouTube or direct video URL.'} />;
}
