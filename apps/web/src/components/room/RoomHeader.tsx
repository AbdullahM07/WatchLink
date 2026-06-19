'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Link2, Lock, LogOut, Unlock } from 'lucide-react';
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

export function RoomHeader({ room, amHost, status, onToggleLock }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const s = STATUS_LABEL[status];

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
          <h1 className="truncate text-lg font-semibold">{room.name}</h1>
          {room.isLocked && <Lock className="h-4 w-4 text-amber-400" aria-label="Locked" />}
        </div>
        <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            {s.text}
          </span>
          <span className="font-mono tracking-widest text-slate-300">{room.roomCode}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
        <Button variant="danger" size="sm" onClick={() => router.push('/dashboard')}>
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      </div>
    </div>
  );
}
