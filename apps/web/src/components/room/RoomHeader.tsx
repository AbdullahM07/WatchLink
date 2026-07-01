'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Link2, Lock, LogOut, Trash2, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicRoom } from '@watchlink/shared';
import type { RoomStatus } from '@/store/room';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface Props {
  room: PublicRoom;
  amHost: boolean;
  status: RoomStatus;
  onToggleLock: (locked: boolean) => void;
  onDeleteRoom: () => void;
}

const STATUS_LABEL: Record<RoomStatus, { text: string; dot: string }> = {
  idle: { text: 'Idle', dot: 'bg-slate-500' },
  connecting: { text: 'Connecting…', dot: 'bg-amber-400 animate-pulse' },
  joining: { text: 'Joining…', dot: 'bg-amber-400 animate-pulse' },
  connected: { text: 'Connected', dot: 'bg-emerald-400' },
  reconnecting: { text: 'Reconnecting…', dot: 'bg-amber-400 animate-pulse' },
  error: { text: 'Error', dot: 'bg-red-500' },
  kicked: { text: 'Removed', dot: 'bg-red-500' },
  closed: { text: 'Closed', dot: 'bg-red-500' },
};

export function RoomHeader({ room, amHost, status, onToggleLock, onDeleteRoom }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout>>();
  const s = STATUS_LABEL[status];

  useEffect(() => () => clearTimeout(deleteTimer.current), []);

  // Two-click safety: first click arms (turns red), a second within 3s deletes.
  const handleDelete = () => {
    if (!deleteArmed) {
      setDeleteArmed(true);
      deleteTimer.current = setTimeout(() => setDeleteArmed(false), 3000);
    } else {
      clearTimeout(deleteTimer.current);
      setDeleteArmed(false);
      onDeleteRoom();
    }
  };

  const copyInvite = async () => {
    const url = `${window.location.origin}/room/${room.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-raised/60 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-display text-xl font-semibold tracking-tight">{room.name}</h1>
          {room.isLocked && <Lock className="h-4 w-4 text-accent-400" aria-label="Locked" />}
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            {s.text}
          </span>
          <span className="font-mono tracking-widest text-slate-300">{room.roomCode}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={copyInvite}>
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          Invite
        </Button>
        {amHost && (
          <Button variant="ghost" size="sm" onClick={() => onToggleLock(!room.isLocked)}>
            {room.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {room.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard')}>
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
        {amHost && (
          <Button
            variant={deleteArmed ? 'danger' : 'ghost'}
            size="sm"
            onClick={handleDelete}
            onMouseLeave={() => {
              clearTimeout(deleteTimer.current);
              setDeleteArmed(false);
            }}
            className={cn(!deleteArmed && 'text-red-400 hover:bg-red-500/10')}
            title={deleteArmed ? 'Click again to confirm' : 'Delete room'}
          >
            {deleteArmed ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {deleteArmed ? 'Confirm' : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  );
}
