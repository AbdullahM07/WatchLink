'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { PublicRoom } from '@watchlink/shared';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { RoomHeader } from '@/components/room/RoomHeader';
import { VideoStage } from '@/components/room/VideoStage';
import { ProgressBar } from '@/components/room/ProgressBar';
import { ParticipantList } from '@/components/room/ParticipantList';
import { SidePanel } from '@/components/room/SidePanel';
import { JoinGate } from '@/components/room/JoinGate';
import type { PlayerTimeApi } from '@/lib/players/timeApi';
import { useAuthStore } from '@/store/auth';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useVoiceChat, type RemoteAudio } from '@/hooks/useVoiceChat';
import { getRoomRequest } from '@/lib/rooms-api';
import { ApiClientError } from '@/lib/api';

/** Plays a peer's remote audio stream. Rendered at page level so it survives tab switches. */
function RemoteAudioPlayer({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
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

  if (!conn.room && (conn.status === 'connecting' || conn.status === 'joining')) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <RoomHeader room={room} amHost={amHost} status={conn.status} onToggleLock={conn.setLocked} />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <VideoStage
            room={room}
            canControl={canControl}
            syncVersion={conn.playerVersion}
            reactions={conn.reactions}
            onPlay={conn.play}
            onPause={conn.pause}
            onSeek={conn.seek}
            onChangeMedia={conn.changeMedia}
            onRequestSync={conn.requestSync}
            onRegisterTime={registerTime}
            onReact={conn.sendReaction}
            onReactionDone={conn.removeReaction}
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

        <div className="h-[480px] overflow-hidden rounded-2xl border border-surface-border bg-surface-raised/60 lg:h-[calc(100vh-9rem)]">
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
