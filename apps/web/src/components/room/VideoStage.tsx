'use client';

import { MonitorPlay } from 'lucide-react';
import type { Participant, PublicRoom, ReactionEmoji } from '@watchlink/shared';
import { CinemaPlayer } from './players/CinemaPlayer';
import { MediaBar } from './MediaBar';
import { ReactionLayer } from './ReactionLayer';
import { StagePresence } from './StagePresence';
import type { RegisterTimeApi } from '@/lib/players/timeApi';
import type { FloatingReaction } from '@/store/room';

interface Props {
  room: PublicRoom;
  canControl: boolean;
  syncVersion: number;
  participants: Participant[];
  selfId: string | null;
  reactions: FloatingReaction[];
  onPlay: (t: number) => void;
  onPause: (t: number) => void;
  onSeek: (t: number) => void;
  onChangeMedia: (url: string) => void;
  onAddToQueue: (url: string) => void;
  onRequestSync: () => void;
  onRegisterTime: RegisterTimeApi;
  onReact: (emoji: ReactionEmoji) => void;
  onReactionDone: (id: string) => void;
}

export function VideoStage({
  room,
  canControl,
  syncVersion,
  participants,
  selfId,
  reactions,
  onPlay,
  onPause,
  onSeek,
  onChangeMedia,
  onAddToQueue,
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
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-surface-overlay to-black">
            <div className="absolute inset-0 bg-[radial-gradient(24rem_16rem_at_50%_40%,rgba(184,90,236,0.12),transparent_70%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/60 text-slate-300 ring-1 ring-white/10">
                <MonitorPlay className="h-7 w-7" />
              </span>
              <p className="font-medium text-slate-200">No video yet</p>
              <p className="max-w-sm px-6 text-sm text-slate-400">
                {canControl
                  ? 'Paste a YouTube or direct video link below to start watching together.'
                  : 'Waiting for the host to pick a video…'}
              </p>
            </div>
          </div>
        )}

        <StagePresence participants={participants} selfId={selfId} />

        <ReactionLayer reactions={reactions} onReact={onReact} onDone={onReactionDone} />
      </div>

      {canControl && <MediaBar onChangeMedia={onChangeMedia} onAddToQueue={onAddToQueue} />}

      {!canControl && hasMedia && (
        <p className="text-center text-xs text-slate-400">
          The host controls playback — your player stays in sync automatically.
        </p>
      )}
    </div>
  );
}
