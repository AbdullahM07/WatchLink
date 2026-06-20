'use client';

import { MonitorPlay } from 'lucide-react';
import type { PublicRoom, ReactionEmoji } from '@watchlink/shared';
import { CinemaPlayer } from './players/CinemaPlayer';
import { MediaBar } from './MediaBar';
import { ReactionLayer } from './ReactionLayer';
import type { RegisterTimeApi } from '@/lib/players/timeApi';
import type { FloatingReaction } from '@/store/room';

interface Props {
  room: PublicRoom;
  canControl: boolean;
  syncVersion: number;
  reactions: FloatingReaction[];
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onChangeMedia: (url: string) => void;
  onRequestSync: () => void;
  onRegisterTime: RegisterTimeApi;
  onReact: (emoji: ReactionEmoji) => void;
  onReactionDone: (id: string) => void;
}

export function VideoStage({
  room,
  canControl,
  syncVersion,
  reactions,
  onPlay,
  onPause,
  onSeek,
  onChangeMedia,
  onRequestSync,
  onRegisterTime,
  onReact,
  onReactionDone,
}: Props) {
  const hasMedia = Boolean(room.player.mediaUrl);

  return (
    <div className="space-y-3">
      {/* Keep the 16:9 stage centred and capped in height so it never grows
          taller than the viewport on wide screens. */}
      <div className="relative mx-auto w-full max-w-[calc(85vh*16/9)]">
        {hasMedia ? (
          <CinemaPlayer
            player={room.player}
            canControl={canControl}
            syncVersion={syncVersion}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            onReady={onRequestSync}
            onRegisterTime={onRegisterTime}
          />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <MonitorPlay className="h-12 w-12 text-slate-600" />
              <p className="text-slate-300">No video yet</p>
              <p className="max-w-sm px-6 text-sm text-slate-500">
                {canControl
                  ? 'Paste a YouTube or direct video link below to start watching together.'
                  : 'Waiting for the host to pick a video…'}
              </p>
            </div>
          </div>
        )}

        <ReactionLayer reactions={reactions} onReact={onReact} onDone={onReactionDone} />
      </div>

      {canControl && <MediaBar onChangeMedia={onChangeMedia} />}

      {!canControl && hasMedia && (
        <p className="text-center text-xs text-slate-500">
          The host controls playback — your player stays in sync automatically.
        </p>
      )}
    </div>
  );
}
