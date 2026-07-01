'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicRoom } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { RoomHeader } from '@/components/room/RoomHeader';
import { ConnectionBanner } from '@/components/room/ConnectionBanner';
import { VideoStage } from '@/components/room/VideoStage';
import { ProgressBar } from '@/components/room/ProgressBar';
import { QueuePanel } from '@/components/room/QueuePanel';
import { ParticipantList } from '@/components/room/ParticipantList';
import { SidePanel } from '@/components/room/SidePanel';
import { JoinGate } from '@/components/room/JoinGate';
import type { PlayerTimeApi } from '@/lib/players/timeApi';
import { useAuthStore } from '@/store/auth';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useVoiceChat, type RemoteAudio } from '@/hooks/useVoiceChat';
import { getRoomRequest } from '@/lib/rooms-api';
import { ApiClientError } from '@/lib/api';
import { cn } from '@/lib/cn';

/** Plays a peer's remote audio stream. Rendered at page level so it survives tab switches. */
function RemoteAudioPlayer({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    // `autoPlay` alone is unreliable for streams whose srcObject is set after mount:
    // some browsers silently refuse to start playback. Kick it off explicitly and
    // surface a one-tap prompt if the autoplay policy blocks it.
    el.play().catch(() => {
      const resume = () => {
        el.play().catch(() => {});
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
      };
      toast.info('Tap anywhere to enable voice audio');
      window.addEventListener('pointerdown', resume);
      window.addEventListener('keydown', resume);
    });
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
      <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-400">{message}</p>
      <Link href="/dashboard" className="mt-6 inline-block">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}

export default function RoomPage({ params }: { params: { roomCode: string } }) {
  const roomCode = params.roomCode.toUpperCase();

  const authStatus = useAuthStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);

  const [info, setInfo] = useState<PublicRoom | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ guestName?: string; password?: string }>({});
  const [enabled, setEnabled] = useState(false);
  // Mobile-only view switch: the chat and the room panels (queue + people) can't
  // both fit a phone alongside the video, so we tab between them. Ignored at lg+.
  const [mobileTab, setMobileTab] = useState<'chat' | 'room'>('chat');

  // Live player time accessor — registered by the active player so the UI can
  // read the EXACT current position when pinning a note (no throttled state lag).
  const [timeApi, setTimeApi] = useState<PlayerTimeApi | null>(null);
  const timeApiRef = useRef<PlayerTimeApi | null>(null);
  const registerTime = useCallback((api: PlayerTimeApi | null) => {
    timeApiRef.current = api;
    setTimeApi(api);
  }, []);
  const getTime = useCallback(() => timeApiRef.current?.getCurrentTime() ?? 0, []);

  // Fetch public room info once auth has resolved.
  useEffect(() => {
    if (authStatus === 'loading') return;
    let cancelled = false;
    getRoomRequest(roomCode)
      .then((room) => !cancelled && setInfo(room))
      .catch((err) =>
        !cancelled && setLoadError(err instanceof ApiClientError ? err.message : 'Failed to load room'),
      );
    return () => {
      cancelled = true;
    };
  }, [roomCode, authStatus]);

  const isAuthed = authStatus === 'authenticated';
  const amHostByInfo = isAuthed && info?.hostId === authUser?.id;
  const needName = authStatus === 'guest';
  const needPassword = Boolean(info?.hasPassword) && !amHostByInfo;
  const gateNeeded = needName || needPassword;

  // Auto-connect when no gate input is required.
  useEffect(() => {
    if (info && !gateNeeded && !enabled) setEnabled(true);
  }, [info, gateNeeded, enabled]);

  const conn = useRoomConnection({
    roomCode,
    password: creds.password,
    guestName: creds.guestName,
    enabled,
  });

  const voice = useVoiceChat({ socket: conn.socket, roomCode });

  // On a join error where the user can correct input, reopen the gate.
  useEffect(() => {
    if (conn.status === 'error' && gateNeeded) setEnabled(false);
  }, [conn.status, gateNeeded]);

  if (loadError) return <ErrorCard title="Room unavailable" message={loadError} />;
  if (authStatus === 'loading' || !info) return <PageSpinner />;

  if (conn.status === 'kicked') {
    return <ErrorCard title="You were removed" message={conn.error ?? 'The host removed you from the room.'} />;
  }
  if (conn.status === 'closed') {
    return <ErrorCard title="Room closed" message={conn.error ?? 'The host closed this room.'} />;
  }
  if (conn.status === 'error' && !gateNeeded) {
    return <ErrorCard title="Could not join" message={conn.error ?? 'Something went wrong.'} />;
  }

  if (!enabled) {
    return (
      <JoinGate
        roomName={info.name}
        needName={needName}
        needPassword={needPassword}
        pending={false}
        error={conn.error}
        onSubmit={(c) => {
          setCreds(c);
          setEnabled(true);
        }}
      />
    );
  }

  const room = conn.room ?? info;
  const amHost = conn.selfId != null && room.hostId === conn.selfId;
  const selfParticipant = conn.participants.find((p) => p.userId === conn.selfId);
  const canControl = amHost || Boolean(selfParticipant?.canControl);
  const hasMedia = Boolean(room.player.mediaUrl);
  // "Lights down": once playback starts, secondary chrome recedes so the film
  // owns the room. It eases back to full opacity on hover/focus.
  const isPlaying = hasMedia && room.player.status === 'playing';

  if (!conn.room && (conn.status === 'connecting' || conn.status === 'joining')) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <ConnectionBanner status={conn.status} />
      <div className={cn(isPlaying && 'lights-down')}>
        <RoomHeader room={room} amHost={amHost} status={conn.status} onToggleLock={conn.setLocked} onDeleteRoom={conn.deleteRoom} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Video + progress — always on top; left column on desktop. */}
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <VideoStage
            room={room}
            canControl={canControl}
            syncVersion={conn.playerVersion}
            participants={conn.participants}
            selfId={conn.selfId}
            reactions={conn.reactions}
            onPlay={conn.play}
            onPause={conn.pause}
            onSeek={conn.seek}
            onChangeMedia={conn.changeMedia}
            onAddToQueue={conn.addToQueue}
            onStop={conn.clearMedia}
            onRequestSync={conn.requestSync}
            onRegisterTime={registerTime}
            onReact={conn.sendReaction}
            onReactionDone={conn.removeReaction}
            timeApi={timeApi}
            canGoNext={conn.queue.length > 0}
            onPlayNext={conn.playNext}
            onPlayPrevious={conn.playPrevious}
          />
          {hasMedia && (
            <ProgressBar
              timeApi={timeApi}
              notes={conn.notes}
              canControl={canControl}
              onAddNote={conn.addNoteAt}
              onJump={conn.seek}
            />
          )}
        </div>

        {/* Mobile-only tab switch between chat and the room panels. */}
        <div className="flex gap-1 rounded-xl border border-surface-border bg-surface-raised/60 p-1 lg:hidden" role="tablist">
          <button
            role="tab"
            aria-selected={mobileTab === 'chat'}
            onClick={() => setMobileTab('chat')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'chat' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-surface-overlay',
            )}
          >
            <MessageSquare className="h-4 w-4" /> Chat
            {conn.messages.length > 0 && (
              <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{conn.messages.length}</span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={mobileTab === 'room'}
            onClick={() => setMobileTab('room')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'room' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-surface-overlay',
            )}
          >
            <UsersIcon className="h-4 w-4" /> Room
            <span className="rounded-full bg-black/20 px-1.5 text-[10px]">{conn.participants.length}</span>
          </button>
        </div>

        {/* Queue + participants — desktop: under the video; mobile: only on the "Room" tab. */}
        <div
          className={cn(
            'space-y-4 lg:col-start-1 lg:row-start-2',
            isPlaying && 'lights-down',
            mobileTab === 'chat' && 'hidden lg:block',
          )}
        >
          <QueuePanel
            queue={conn.queue}
            canControl={canControl}
            onPlayNext={conn.playNext}
            onRemove={conn.removeFromQueue}
          />
          <div className="rounded-2xl border border-surface-border bg-surface-raised/60 p-3">
            <ParticipantList
              participants={conn.participants}
              selfId={conn.selfId}
              hostId={room.hostId}
              amHost={amHost}
              onKick={conn.kick}
              onTransfer={conn.transferHost}
              onGrantControl={conn.grantControl}
              onRevokeControl={conn.revokeControl}
            />
          </div>
        </div>

        {/* Chat / notes — desktop: right column, full height; mobile: only on the "Chat" tab. */}
        <div
          className={cn(
            'h-[70vh] overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/60',
            'lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:h-[calc(100vh-9rem)]',
            mobileTab === 'room' && 'hidden lg:block',
          )}
        >
          <SidePanel
            messages={conn.messages}
            notes={conn.notes}
            selfId={conn.selfId}
            amHost={amHost}
            canControl={canControl}
            voice={voice}
            getTime={getTime}
            hasMedia={hasMedia}
            onSend={conn.sendMessage}
            onDeleteMessage={conn.deleteMessage}
            onAddNote={conn.addNoteAt}
            onDeleteNote={conn.deleteNote}
            onJump={conn.seek}
          />
        </div>
      </div>

      {/* Hidden remote audio — kept at page level so voice persists across tabs. */}
      <div className="sr-only" aria-hidden>
        {voice.remoteStreams.map((r: RemoteAudio) => (
          <RemoteAudioPlayer key={r.userId} stream={r.stream} />
        ))}
      </div>
    </div>
  );
}
