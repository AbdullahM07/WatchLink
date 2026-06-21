'use client';

import { useState } from 'react';
import { Film } from 'lucide-react';
import { resolveProvider, type PlayerState } from '@watchlink/shared';
import { YouTubePlayer } from './YouTubePlayer';
import { DirectPlayer } from './DirectPlayer';
import { FacebookPlayer } from './FacebookPlayer';
import { SocialPlayer } from './SocialPlayer';
import { AudioStageOverlay } from './AudioStageOverlay';
import type { RegisterTimeApi } from '@/lib/players/timeApi';
import type { LocalPlayback } from '@/lib/players/localPlayback';

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
  /** Stop the broadcast for the whole room (host/controller only). */
  onStop?: () => void;
  /** Fired (controllers only) when the current item ends, to drive auto-advance. */
  onEnded?: () => void;
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

export function CinemaPlayer({ audioUi, onStop, onEnded, ...props }: Props) {
  const { player, canControl } = props;
  const resolution = resolveProvider(player.mediaUrl ?? '');

  // The active player registers a handle to its real element so the audio overlay
  // can drive play/pause/volume directly (in-gesture), and reports whether it's
  // actually playing so the overlay shows the right state.
  const [localApi, setLocalApi] = useState<LocalPlayback | null>(null);
  const [localPlaying, setLocalPlaying] = useState(false);

  // Players that drive a real audio/video element we can hide behind the audio
  // overlay while keeping playback + sync alive underneath.
  let inner: React.ReactNode = null;
  if (resolution.provider === 'youtube' && resolution.embedId) {
    inner = (
      <YouTubePlayer
        {...props}
        embedId={resolution.embedId}
        onRegisterLocal={setLocalApi}
        onLocalPlayingChange={setLocalPlaying}
        onEnded={onEnded}
      />
    );
  } else if (resolution.provider === 'direct' || resolution.provider === 'hls') {
    inner = (
      <DirectPlayer
        {...props}
        onRegisterLocal={setLocalApi}
        onLocalPlayingChange={setLocalPlaying}
        onEnded={onEnded}
      />
    );
  } else if (resolution.provider === 'facebook' && resolution.canControlPlayback) {
    // Regular Facebook videos sync via the Embedded Video Player SDK.
    inner = <FacebookPlayer {...props} />;
  }

  if (inner) {
    return (
      <div className="relative">
        {inner}
        {audioUi && (
          <AudioStageOverlay
            resolution={resolution}
            isAudioSource={resolution.kind === 'audio'}
            api={localApi}
            localPlaying={localPlaying}
            roomStatus={player.status}
            canControl={canControl}
            onStop={onStop}
          />
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
