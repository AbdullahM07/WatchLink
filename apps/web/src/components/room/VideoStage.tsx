'use client';

import { MonitorPlay, Video, AudioLines } from 'lucide-react';
import { resolveProvider, type Participant, type PublicRoom, type ReactionEmoji } from '@watchlink/shared';
import { CinemaPlayer } from './players/CinemaPlayer';
import { MediaBar } from './MediaBar';
import { ReactionLayer } from './ReactionLayer';
import { StagePresence } from './StagePresence';
import { cn } from '@/lib/cn';
import { usePlaybackPrefs } from '@/store/playbackPrefs';
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

  // Per-user (local) audio preference — never synced. The source itself can also
  // be audio-native (radio / podcast), which forces the audio presentation.
  const audioOnly = usePlaybackPrefs((s) => s.audioOnly);
  const setAudioOnly = usePlaybackPrefs((s) => s.setAudioOnly);
  const resolution = hasMedia ? resolveProvider(room.player.mediaUrl ?? '') : null;
  const isAudioSource = resolution?.kind === 'audio';
  const audioUi = isAudioSource || audioOnly;

  return (
    <div className="space-y-3">
      {hasMedia && (
        <ViewToggle audio={audioUi} locked={Boolean(isAudioSource)} onChange={setAudioOnly} />
      )}

      {/* Keep the 16:9 stage centred and capped in height so it never grows
          taller than the viewport on wide screens. */}
      <div className="relative mx-auto w-full max-w-[calc(85vh*16/9)]">
        {hasMedia ? (
          <CinemaPlayer
            player={room.player}
            canControl={canControl}
            syncVersion={syncVersion}
            audioUi={audioUi}
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
              <p className="font-medium text-slate-200">Nothing playing yet</p>
              <p className="max-w-sm px-6 text-sm text-slate-400">
                {canControl
                  ? 'Paste a video or audio link below — or tap Quran Radio — to start together.'
                  : 'Waiting for the host to pick something…'}
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

/**
 * Per-user Video / Audio switch. Local to each viewer — toggling it only changes
 * what *you* see, never the room. Locked to Audio when the source is audio-only.
 */
function ViewToggle({
  audio,
  locked,
  onChange,
}: {
  audio: boolean;
  locked: boolean;
  onChange: (audioOnly: boolean) => void;
}) {
  const base =
    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default';
  return (
    <div className="flex justify-end">
      <div
        role="group"
        aria-label="Playback view"
        className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-surface-raised/60 p-1"
      >
        <button
          type="button"
          disabled={locked}
          aria-pressed={!audio}
          onClick={() => onChange(false)}
          className={cn(base, !audio ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400 hover:text-slate-200')}
        >
          <Video className="h-3.5 w-3.5" /> Video
        </button>
        <button
          type="button"
          aria-pressed={audio}
          onClick={() => onChange(true)}
          className={cn(base, audio ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400 hover:text-slate-200')}
        >
          <AudioLines className="h-3.5 w-3.5" /> Audio
        </button>
      </div>
    </div>
  );
}
